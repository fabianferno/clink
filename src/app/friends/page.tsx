"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers";
import { useWallets } from "@privy-io/react-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode, ScanLine, Ghost, Users, Loader2, Check, X, RefreshCw
} from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PatternGraphic } from "@/components/ui/pattern-graphic";
import QRCode from "react-qr-code";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Node,
    Edge,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { publicClient } from "@/lib/arkiv";
import { createArkivWalletClient } from "@/lib/arkiv-wallet";
import { eq, or } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { mendoza } from "@arkiv-network/sdk/chains";

const hasPrivy =
    typeof process.env.NEXT_PUBLIC_PRIVY_APP_ID === "string" &&
    process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "placeholder" &&
    process.env.NEXT_PUBLIC_PRIVY_APP_ID.length >= 10;

export interface FriendNode {
    id: string;
    address: string;
    displayName: string;
    isAttending: number;
    topCommunity: string;
    sharedEvents: number;
    x?: number;
    y?: number;
}

interface FriendEvent {
    id: string;
    title: string;
    date: string;
    timestamp: number;
    friendsAttending: string[];
    imageSeed: string;
}

interface PendingRequest {
    entityKey: string;
    initiatorAddress: string;
    initiatorDisplay: string;
    eventTitle: string;
    timestamp: number;
}

export default function FriendsPage() {
    if (!hasPrivy) return <FriendsPageLite />;
    return <FriendsPageFull />;
}

function FriendsPageLite() {
    const { ready, authenticated, login } = useAuth();
    if (!ready) return <LoadingScreen />;
    if (!authenticated) return <ConnectScreen onLogin={login} />;
    return (
        <div className="min-h-screen bg-black flex flex-col">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <p className="text-white/40 font-mono">Wallet not configured — add NEXT_PUBLIC_PRIVY_APP_ID to enable the network.</p>
            </div>
        </div>
    );
}

function FriendsPageFull() {
    const { ready, authenticated, login, user } = useAuth();
    const { wallets } = useWallets();
    const [isIncognito, setIsIncognito] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [qrTab, setQrTab] = useState<'my-code' | 'scan'>('my-code');

    const [friends, setFriends] = useState<FriendNode[]>([]);
    const [friendEvents, setFriendEvents] = useState<FriendEvent[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(true);

    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<FriendNode | null>(null);

    const [scanStatus, setScanStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'already'>('idle');
    const [scanError, setScanError] = useState<string | null>(null);

    const [acceptingKey, setAcceptingKey] = useState<string | null>(null);

    const walletAddress =
        user?.wallet?.address ??
        (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as { address: string } | undefined)?.address ??
        wallets[0]?.address ??
        "";

    // ─── Build React Flow graph from friend data ───────────────────────────
    const buildGraph = useCallback((friendList: FriendNode[], myAddr: string) => {
        if (friendList.length === 0) {
            setNodes([{
                id: 'center-user',
                position: { x: 0, y: 0 },
                data: { label: 'You', userAddress: myAddr },
                type: 'userNode',
            }]);
            setEdges([]);
            return;
        }

        const maxShared = Math.max(...friendList.map(f => f.sharedEvents), 1);

        const withPositions = friendList.map((friend, index) => {
            const strengthRatio = friend.sharedEvents / maxShared;
            const radius = 15 + ((1 - strengthRatio) * 25);
            const angle = (index / friendList.length) * Math.PI * 2;
            return { ...friend, x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
        });

        const flowNodes: Node[] = withPositions.map((f) => ({
            id: f.id,
            position: { x: (f.x! / 100) * 800 - 400, y: (f.y! / 100) * 800 - 400 },
            data: { label: f.displayName, friend: f, setSelectedFriend, allFriends: withPositions },
            type: 'friendNode',
        }));
        flowNodes.push({
            id: 'center-user',
            position: { x: 0, y: 0 },
            data: { label: 'You', userAddress: myAddr },
            type: 'userNode',
        });

        const maxSharedVal = Math.max(...withPositions.map(f => f.sharedEvents), 1);
        const flowEdges: Edge[] = withPositions.map((f) => {
            const ratio = f.sharedEvents / maxSharedVal;
            return {
                id: `e-center-${f.id}`,
                source: 'center-user',
                target: f.id,
                interactionWidth: 25,
                style: {
                    stroke: `rgba(255,82,162,${0.2 + ratio * 0.6})`,
                    strokeWidth: 2 + ratio * 4,
                    strokeDasharray: ratio > 0.5 ? "none" : "10 5",
                    cursor: 'pointer',
                },
                animated: ratio > 0.5,
            };
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
    }, []);

    // ─── Load friends from Arkiv ───────────────────────────────────────────
    const loadFriendsData = useCallback(async () => {
        if (!walletAddress) return;
        setLoadingFriends(true);

        try {
            // 1. Fetch all confirmed clinks involving me
            const confirmedQ = publicClient.buildQuery();
            const confirmedResult = await confirmedQ
                .where(eq("type", "clink"))
                .where(eq("status", "confirmed"))
                .where(or([eq("initiator", walletAddress), eq("receiver", walletAddress)]))
                .withPayload(true)
                .withAttributes(true)
                .limit(100)
                .fetch();

            // 2. Fetch incoming pending clinks (I am the receiver)
            const pendingQ = publicClient.buildQuery();
            const pendingResult = await pendingQ
                .where(eq("type", "clink"))
                .where(eq("status", "pending"))
                .where(eq("receiver", walletAddress))
                .withPayload(true)
                .limit(50)
                .fetch();

            // 3. Build unique confirmed friend addresses
            const seenAddresses = new Set<string>();
            const friendAddresses: string[] = [];
            for (const clink of confirmedResult.entities) {
                const pd = clink.toJson() as Record<string, unknown>;
                const initiator = (pd.initiator as string || "").toLowerCase();
                const receiver = (pd.receiver as string || "").toLowerCase();
                const friendAddr = initiator === walletAddress.toLowerCase() ? pd.receiver as string : pd.initiator as string;
                if (friendAddr && !seenAddresses.has(friendAddr.toLowerCase())) {
                    seenAddresses.add(friendAddr.toLowerCase());
                    friendAddresses.push(friendAddr);
                }
            }

            // 4. Build pending requests list (filter out already-friends)
            const pending: PendingRequest[] = pendingResult.entities
                .map(e => {
                    const pd = e.toJson() as Record<string, unknown>;
                    const initiator = pd.initiator as string || "";
                    return {
                        entityKey: e.key,
                        initiatorAddress: initiator,
                        initiatorDisplay: initiator ? `${initiator.slice(0, 6)}...${initiator.slice(-4)}` : "Unknown",
                        eventTitle: pd.eventTitle as string || "an event",
                        timestamp: pd.timestamp as number || 0,
                    };
                })
                .filter(r => !seenAddresses.has(r.initiatorAddress.toLowerCase()));
            setPendingRequests(pending);

            // 5. Fetch my checked-in RSVPs for shared events calculation
            const myRsvpQ = publicClient.buildQuery();
            const myRsvps = await myRsvpQ
                .where(eq("type", "rsvp"))
                .where(eq("attendee", walletAddress))
                .where(eq("checked_in", 1))
                .withAttributes(true)
                .limit(100)
                .fetch();
            const myEventKeys = new Set(
                myRsvps.entities
                    .map(e => e.attributes?.find(a => a.key === "event_key")?.value as string)
                    .filter(Boolean)
            );

            // 6. For each friend, fetch their RSVPs in parallel
            const now = Math.floor(Date.now() / 1000);
            const thirtyDaysAgo = now - 30 * 24 * 3600;

            const friendDataList = await Promise.all(
                friendAddresses.map(async (friendAddr): Promise<FriendNode> => {
                    try {
                        const friendRsvpQ = publicClient.buildQuery();
                        const friendRsvps = await friendRsvpQ
                            .where(eq("type", "rsvp"))
                            .where(eq("attendee", friendAddr))
                            .withAttributes(true)
                            .limit(100)
                            .fetch();

                        const friendRsvpAttrs = friendRsvps.entities.map(e => ({
                            eventKey: e.attributes?.find(a => a.key === "event_key")?.value as string,
                            checkedIn: Number(e.attributes?.find(a => a.key === "checked_in")?.value),
                            rsvpTs: Number(e.attributes?.find(a => a.key === "rsvp_timestamp")?.value),
                        }));

                        const sharedEvents = friendRsvpAttrs.filter(
                            r => r.checkedIn === 1 && myEventKeys.has(r.eventKey)
                        ).length;

                        const isAttending = friendRsvpAttrs.filter(
                            r => r.checkedIn === 0 && r.rsvpTs > thirtyDaysAgo
                        ).length;

                        // Get top community from their attendance proofs
                        let topCommunity = "general";
                        try {
                            const attQ = publicClient.buildQuery();
                            const attResult = await attQ
                                .where(eq("type", "attendance"))
                                .where(eq("attendee", friendAddr))
                                .withAttributes(true)
                                .limit(30)
                                .fetch();
                            const counts: Record<string, number> = {};
                            for (const att of attResult.entities) {
                                const comm = att.attributes?.find(a => a.key === "community")?.value as string;
                                if (comm && comm !== "general") counts[comm] = (counts[comm] || 0) + 1;
                            }
                            const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                            if (top) topCommunity = top[0];
                        } catch { /* use default */ }

                        return {
                            id: friendAddr,
                            address: friendAddr,
                            displayName: `${friendAddr.slice(0, 6)}...${friendAddr.slice(-4)}`,
                            isAttending,
                            topCommunity,
                            sharedEvents: Math.max(sharedEvents, 1),
                        };
                    } catch {
                        return {
                            id: friendAddr,
                            address: friendAddr,
                            displayName: `${friendAddr.slice(0, 6)}...${friendAddr.slice(-4)}`,
                            isAttending: 0,
                            topCommunity: "general",
                            sharedEvents: 1,
                        };
                    }
                })
            );

            setFriends(friendDataList);

            // 7. Build friends events feed — collect unique upcoming event keys from friends' RSVPs
            const eventKeyToFriends: Record<string, string[]> = {};
            for (const friend of friendDataList) {
                try {
                    const upRsvpQ = publicClient.buildQuery();
                    const upRsvps = await upRsvpQ
                        .where(eq("type", "rsvp"))
                        .where(eq("attendee", friend.address))
                        .where(eq("checked_in", 0))
                        .withAttributes(true)
                        .limit(20)
                        .fetch();
                    for (const rsvp of upRsvps.entities) {
                        const ek = rsvp.attributes?.find(a => a.key === "event_key")?.value as string;
                        const ts = Number(rsvp.attributes?.find(a => a.key === "rsvp_timestamp")?.value || 0);
                        if (ek && ts > thirtyDaysAgo) {
                            if (!eventKeyToFriends[ek]) eventKeyToFriends[ek] = [];
                            if (!eventKeyToFriends[ek].includes(friend.address)) {
                                eventKeyToFriends[ek].push(friend.address);
                            }
                        }
                    }
                } catch { /* skip */ }
            }

            // 8. Fetch event details for those keys
            const eventKeys = Object.keys(eventKeyToFriends).slice(0, 10);
            const eventList: FriendEvent[] = (
                await Promise.all(
                    eventKeys.map(async (ek) => {
                        try {
                            const hexKey = ek.startsWith("0x") ? ek : `0x${ek}`;
                            const entity = await publicClient.getEntity(hexKey as `0x${string}`);
                            if (!entity) return null;
                            const pd = entity.payload ? entity.toJson() as Record<string, unknown> : {};
                            const attrs = entity.attributes || [];
                            const ts = (attrs.find(a => a.key === "event_timestamp")?.value as number) || 0;
                            if (ts < now) return null; // skip past events
                            const dateObj = new Date(ts * 1000);
                            return {
                                id: ek,
                                title: (pd.title as string) || "Untitled Event",
                                date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                                timestamp: ts,
                                friendsAttending: eventKeyToFriends[ek],
                                imageSeed: ek,
                            } as FriendEvent;
                        } catch { return null; }
                    })
                )
            ).filter(Boolean) as FriendEvent[];

            eventList.sort((a, b) => a.timestamp - b.timestamp);
            setFriendEvents(eventList);

            // Build graph
            buildGraph(friendDataList, walletAddress);
        } catch (err) {
            console.error("Failed to load friends:", err);
            setFriends([]);
            buildGraph([], walletAddress);
        } finally {
            setLoadingFriends(false);
        }
    }, [walletAddress, buildGraph]);

    useEffect(() => {
        if (authenticated && walletAddress) {
            loadFriendsData();
        }
    }, [authenticated, walletAddress, loadFriendsData]);

    // ─── QR scan handler ──────────────────────────────────────────────────
    const handleQrScan = async (results: IDetectedBarcode[]) => {
        if (!results?.length || scanStatus === 'loading') return;
        const raw = results[0].rawValue;
        if (!raw.startsWith("clink:add-friend:")) return;

        const targetAddress = raw.replace("clink:add-friend:", "").trim();
        if (!targetAddress || !targetAddress.startsWith("0x")) {
            setScanError("Invalid QR code.");
            setScanStatus("error");
            return;
        }
        if (targetAddress.toLowerCase() === walletAddress.toLowerCase()) {
            setScanError("That's your own code!");
            setScanStatus("error");
            return;
        }

        // Check already friends
        if (friends.some(f => f.address.toLowerCase() === targetAddress.toLowerCase())) {
            setScanStatus("already");
            return;
        }

        const wallet = wallets[0];
        if (!wallet) { setScanError("No wallet connected."); setScanStatus("error"); return; }

        setScanStatus("loading");
        setScanError(null);

        try {
            const provider = await wallet.getEthereumProvider();
            await wallet.switchChain(mendoza.id);
            const wc = createArkivWalletClient(provider, wallet.address as `0x${string}`);
            const now = Math.floor(Date.now() / 1000);

            await wc.createEntity({
                payload: jsonToPayload({
                    initiator: walletAddress,
                    receiver: targetAddress,
                    eventEntityKey: "direct",
                    eventTitle: "Direct Add",
                    status: "confirmed",
                    message: "",
                    timestamp: now,
                }),
                contentType: "application/json",
                attributes: [
                    { key: "type", value: "clink" },
                    { key: "initiator", value: walletAddress },
                    { key: "receiver", value: targetAddress },
                    { key: "event_key", value: "direct" },
                    { key: "status", value: "confirmed" },
                    { key: "clink_timestamp", value: now },
                ],
                expiresIn: ExpirationTime.fromDays(365),
            });

            setScanStatus("success");
            setTimeout(() => {
                setShowQR(false);
                setScanStatus("idle");
                loadFriendsData();
            }, 2000);
        } catch (err) {
            setScanError(err instanceof Error ? err.message : "Failed to add friend");
            setScanStatus("error");
        }
    };

    // ─── Accept pending request ────────────────────────────────────────────
    const handleAccept = async (req: PendingRequest) => {
        const wallet = wallets[0];
        if (!wallet) return;
        setAcceptingKey(req.entityKey);
        try {
            const provider = await wallet.getEthereumProvider();
            await wallet.switchChain(mendoza.id);
            const wc = createArkivWalletClient(provider, wallet.address as `0x${string}`);
            const now = Math.floor(Date.now() / 1000);

            // Receiver creates a mirror confirmed clink
            await wc.createEntity({
                payload: jsonToPayload({
                    initiator: walletAddress,
                    receiver: req.initiatorAddress,
                    eventEntityKey: "accepted",
                    eventTitle: req.eventTitle,
                    status: "confirmed",
                    message: "",
                    timestamp: now,
                }),
                contentType: "application/json",
                attributes: [
                    { key: "type", value: "clink" },
                    { key: "initiator", value: walletAddress },
                    { key: "receiver", value: req.initiatorAddress },
                    { key: "event_key", value: "accepted" },
                    { key: "status", value: "confirmed" },
                    { key: "clink_timestamp", value: now },
                ],
                expiresIn: ExpirationTime.fromDays(365),
            });

            setPendingRequests(p => p.filter(r => r.entityKey !== req.entityKey));
            loadFriendsData();
        } catch (err) {
            console.error("Failed to accept:", err);
        } finally {
            setAcceptingKey(null);
        }
    };

    if (!ready) return <LoadingScreen />;
    if (!authenticated) return <ConnectScreen onLogin={login} />;

    return (
        <div className="min-h-screen bg-black overflow-x-hidden flex flex-col relative">
            <Header />

            <div className="absolute top-0 right-0 w-full max-w-lg h-[600px] bg-secondary/10 blur-[140px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full max-w-lg h-[400px] bg-primary/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 w-full max-w-md mx-auto px-4 pt-28 pb-32 flex flex-col relative z-10"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="font-malinton text-4xl font-black text-white">NETWORK</h1>
                    <button
                        onClick={() => setIsIncognito(!isIncognito)}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-3 pr-1 py-1 hover:bg-white/10 transition-colors"
                    >
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">
                            {isIncognito ? "Ghost Mode" : "Public"}
                        </span>
                        <div className={`w-8 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center ${isIncognito ? 'bg-white' : 'bg-white/20'}`}>
                            <motion.div
                                layout
                                className={`w-4 h-4 rounded-full shadow-sm flex items-center justify-center ${isIncognito ? 'bg-black' : 'bg-white'}`}
                                animate={{ x: isIncognito ? 12 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                                {isIncognito && <Ghost className="w-2.5 h-2.5 text-white" />}
                            </motion.div>
                        </div>
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {isIncognito ? (
                        <motion.div
                            key="ghost-mode"
                            initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                            exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                            className="flex-1 flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-32 h-32 rounded-full border border-white/5 bg-white/5 flex items-center justify-center mb-8 relative">
                                <Ghost className="w-12 h-12 text-white/20" />
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <Ghost className="w-12 h-12 text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                                </motion.div>
                            </div>
                            <h2 className="font-malinton text-3xl font-bold text-white mb-2">GHOST MODE ACTIVE</h2>
                            <p className="text-white/40 font-medium max-w-[80%] mx-auto text-sm">
                                You are hidden from the network.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="public-mode"
                            initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                            exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                            className="flex flex-col gap-8"
                        >
                            {/* ── Social Graph ── */}
                            <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden relative h-[350px]">
                                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                                    <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">Your Graph</p>
                                    {loadingFriends ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-white/30" />
                                            <span className="text-white/30 text-sm">Loading...</span>
                                        </div>
                                    ) : (
                                        <p className="text-white text-xl font-black">{friends.length} Connection{friends.length !== 1 ? 's' : ''}</p>
                                    )}
                                </div>

                                <div className="absolute top-4 right-4 z-10 flex gap-2">
                                    <button
                                        onClick={loadFriendsData}
                                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/5"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 text-white ${loadingFriends ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                <div className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing">
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        nodeTypes={{
                                            userNode: ({ data }: { data: { userAddress: string } }) => (
                                                <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-primary bg-black shadow-[0_0_30px_rgba(255,82,162,0.6)] relative">
                                                    <Handle type="source" position={Position.Top} className="opacity-0 w-1 h-1" />
                                                    <Handle type="target" position={Position.Bottom} className="opacity-0 w-1 h-1" />
                                                    <PatternGraphic seed={data.userAddress} variant="pink" />
                                                </div>
                                            ),
                                            friendNode: ({ data }: { data: { friend: FriendNode; setSelectedFriend: (f: FriendNode) => void; allFriends: FriendNode[] } }) => {
                                                const friend = data.friend;
                                                const allFriends = data.allFriends;
                                                const maxShared = Math.max(...allFriends.map((f) => f.sharedEvents), 1);
                                                const strengthRatio = friend.sharedEvents / maxShared;
                                                const avatarScale = 1 + strengthRatio * 0.3;
                                                return (
                                                    <div
                                                        className="relative cursor-pointer hover:z-50 group"
                                                        style={{ transform: `scale(${avatarScale})` }}
                                                        onClick={(e) => { e.stopPropagation(); data.setSelectedFriend(friend); }}
                                                    >
                                                        <Handle type="target" position={Position.Top} className="opacity-0 w-1 h-1" />
                                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-black group-hover:border-primary/80 group-hover:shadow-[0_0_20px_rgba(255,82,162,0.4)] transition-all">
                                                            <PatternGraphic seed={friend.address} variant="beige" />
                                                        </div>
                                                        {friend.isAttending > 0 && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-[3px] border-[#141414] shadow-[0_0_10px_rgba(255,82,162,1)]" />
                                                        )}
                                                    </div>
                                                );
                                            }
                                        }}
                                        fitView
                                        maxZoom={1.5}
                                        minZoom={0.5}
                                        proOptions={{ hideAttribution: true }}
                                    >
                                        <Background color="#ffffff05" variant={BackgroundVariant.Dots} gap={20} size={1} />
                                    </ReactFlow>
                                </div>

                                {!loadingFriends && friends.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                        <Users className="w-12 h-12 text-white/10 mb-3" />
                                        <p className="text-white/30 text-sm font-medium">No connections yet</p>
                                        <p className="text-white/20 text-xs mt-1">Clink with people at events or scan a QR code</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Pending Requests ── */}
                            {pendingRequests.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">
                                        Pending Clinks ({pendingRequests.length})
                                    </p>
                                    {pendingRequests.map((req) => (
                                        <div key={req.entityKey} className="bg-white/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                                                <PatternGraphic seed={req.initiatorAddress} variant="beige" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold text-sm truncate">{req.initiatorDisplay}</p>
                                                <p className="text-white/40 text-xs">wants to Clink from <span className="text-white/60">{req.eventTitle}</span></p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleAccept(req)}
                                                    disabled={acceptingKey === req.entityKey}
                                                    className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 flex items-center justify-center hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {acceptingKey === req.entityKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={() => setPendingRequests(p => p.filter(r => r.entityKey !== req.entityKey))}
                                                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:bg-white/10 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Friends Events Feed ── */}
                            <div className="flex flex-col gap-4">
                                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">
                                    Friends are attending
                                </p>

                                {loadingFriends ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-white/20" />
                                    </div>
                                ) : friendEvents.length === 0 ? (
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center">
                                        <p className="text-white/30 text-sm">No upcoming events from your network.</p>
                                        <p className="text-white/20 text-xs mt-1">When your friends RSVP to events, they&apos;ll appear here.</p>
                                    </div>
                                ) : (
                                    friendEvents.map((event) => (
                                        <a key={event.id} href={`/events/${event.id}`} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/10 transition-colors">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black border border-white/10">
                                                <PatternGraphic seed={event.imageSeed} variant="beige" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-bold truncate">{event.title}</h3>
                                                <p className="text-white/50 text-xs mt-1">{event.date}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex -space-x-2">
                                                        {event.friendsAttending.slice(0, 3).map((addr, i) => (
                                                            <div key={i} className="w-5 h-5 rounded-full overflow-hidden border border-black bg-black">
                                                                <PatternGraphic seed={addr} variant="beige" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                                                        {event.friendsAttending.length} Friend{event.friendsAttending.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
                                        </a>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ── Friend Detail Modal ── */}
            <AnimatePresence>
                {selectedFriend && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedFriend(null)}
                        className="fixed inset-0 z-100 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4"
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#141414] border-t sm:border border-white/10 w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 pb-12 sm:pb-8 relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/20 blur-[60px] pointer-events-none rounded-full" />
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 sm:hidden" />

                            <div className="flex items-center gap-5 mb-8 relative z-10">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/50 bg-black shrink-0 shadow-[0_0_20px_rgba(255,82,162,0.3)]">
                                    <PatternGraphic seed={selectedFriend.address} variant="beige" />
                                </div>
                                <div>
                                    <Badge variant="secondary" className="mb-2 bg-primary/20 text-primary border-primary/30 tracking-widest text-[10px] uppercase font-bold">
                                        {selectedFriend.sharedEvents} Shared Event{selectedFriend.sharedEvents !== 1 ? 's' : ''}
                                    </Badge>
                                    <h3 className="text-xl font-bold text-white font-mono">{selectedFriend.displayName}</h3>
                                    <p className="text-white/50 text-sm mt-1">
                                        Top Community{" "}
                                        <span className="text-white font-semibold">#{selectedFriend.topCommunity}</span>
                                    </p>
                                    {selectedFriend.isAttending > 0 && (
                                        <p className="text-primary text-xs mt-1 font-bold">
                                            🎯 Going to {selectedFriend.isAttending} upcoming event{selectedFriend.isAttending > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button
                                className="w-full bg-white text-black hover:bg-gray-200 font-bold tracking-wide h-12 text-sm rounded-xl mb-3"
                                asChild
                            >
                                <a href={`/profile?address=${selectedFriend.address}`}>View Full Profile</a>
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full text-white/50 hover:text-white hover:bg-white/5 font-bold tracking-wide h-12 text-sm rounded-xl"
                                onClick={() => setSelectedFriend(null)}
                            >
                                Close
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── QR FAB ── */}
            <AnimatePresence>
                {!isIncognito && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-32 right-4 z-60 md:hidden"
                    >
                        <button
                            onClick={() => { setShowQR(true); setQrTab('my-code'); setScanStatus('idle'); setScanError(null); }}
                            className="w-14 h-14 rounded-full bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                        >
                            <QrCode className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── QR Modal ── */}
            <AnimatePresence>
                {showQR && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center px-4"
                    >
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowQR(false)} />
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#141414] border border-white/10 rounded-[2rem] p-6 w-full max-w-sm relative z-10 shadow-2xl"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="bg-white/5 rounded-full p-1 flex">
                                    <button
                                        onClick={() => { setQrTab('my-code'); setScanStatus('idle'); setScanError(null); }}
                                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${qrTab === 'my-code' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
                                    >
                                        My Code
                                    </button>
                                    <button
                                        onClick={() => setQrTab('scan')}
                                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${qrTab === 'scan' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
                                    >
                                        <ScanLine className="w-3 h-3" />
                                        Scan
                                    </button>
                                </div>
                            </div>

                            {qrTab === 'my-code' ? (
                                <>
                                    <div className="bg-white rounded-2xl p-6 flex items-center justify-center aspect-square mb-6">
                                        <QRCode
                                            value={`clink:add-friend:${walletAddress}`}
                                            size={256}
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                            viewBox="0 0 256 256"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-malinton text-2xl font-bold text-white mb-1">Add Me</h3>
                                        <p className="text-white/50 text-sm">Let someone scan this to add you to their network.</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {scanStatus === 'success' ? (
                                        <div className="aspect-square flex flex-col items-center justify-center mb-6 rounded-2xl bg-green-500/10 border border-green-500/20">
                                            <Check className="w-16 h-16 text-green-400 mb-3" />
                                            <p className="text-green-400 font-bold text-lg">Friend Added!</p>
                                            <p className="text-white/40 text-sm mt-1">Connection saved to Arkiv.</p>
                                        </div>
                                    ) : scanStatus === 'already' ? (
                                        <div className="aspect-square flex flex-col items-center justify-center mb-6 rounded-2xl bg-white/5 border border-white/10">
                                            <Users className="w-16 h-16 text-white/20 mb-3" />
                                            <p className="text-white font-bold">Already connected!</p>
                                        </div>
                                    ) : (
                                        <div className="bg-black rounded-2xl overflow-hidden border border-white/10 aspect-square mb-6 relative">
                                            {scanStatus === 'loading' && (
                                                <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center">
                                                    <Loader2 className="w-10 h-10 animate-spin text-white" />
                                                </div>
                                            )}
                                            <Scanner
                                                onScan={handleQrScan}
                                                formats={['qr_code']}
                                                styles={{ container: { width: '100%', height: '100%' } }}
                                            />
                                        </div>
                                    )}
                                    {scanError && <p className="text-red-400 text-sm text-center mb-3">{scanError}</p>}
                                    <div className="text-center">
                                        <h3 className="font-malinton text-2xl font-bold text-white mb-1">Scan Code</h3>
                                        <p className="text-white/50 text-sm">Point your camera at a friend&apos;s Clink QR code.</p>
                                    </div>
                                </>
                            )}

                            <Button
                                onClick={() => { setShowQR(false); setScanStatus('idle'); setScanError(null); }}
                                className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white rounded-xl h-12"
                            >
                                Close
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-black overflow-x-hidden flex flex-col relative">
            <Header />
            <div className="flex-1 w-full max-w-md mx-auto px-4 pt-28 pb-32 flex flex-col relative z-10 animate-pulse">
                <div className="flex items-center justify-between mb-8">
                    <div className="h-10 w-40 bg-white/10 rounded-lg" />
                    <div className="h-8 w-24 bg-white/10 rounded-full" />
                </div>
                <div className="flex flex-col gap-8">
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 h-[350px] relative">
                        <div className="w-24 h-4 bg-white/10 rounded mb-2" />
                        <div className="w-32 h-6 bg-white/10 rounded" />
                        <div className="absolute inset-x-0 bottom-1/2 flex justify-center">
                            <div className="w-24 h-24 rounded-full bg-white/5" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="w-32 h-3 bg-white/10 rounded" />
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-white/10 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                                    <div className="h-3 w-1/2 bg-white/10 rounded" />
                                    <div className="h-4 w-24 bg-white/10 rounded mt-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConnectScreen({ onLogin }: { onLogin: () => void }) {
    return (
        <div className="min-h-screen bg-black flex flex-col">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-24 mx-auto max-w-lg w-full text-center">
                <div className="w-24 h-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-8">
                    <Users className="w-10 h-10 text-white/40" />
                </div>
                <h1 className="font-malinton text-4xl font-black text-white mb-4">CONNECT IDENTITY</h1>
                <p className="text-white/60 mb-8 font-medium">
                    Connect your wallet to find your friends, see where they&apos;re going, and build your social graph.
                </p>
                <Button onClick={onLogin} size="lg" className="w-full h-14 bg-primary text-black font-bold hover:bg-primary/90 text-lg">
                    Connect Wallet
                </Button>
            </div>
        </div>
    );
}
