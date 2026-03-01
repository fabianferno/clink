"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/providers";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { QrCode, ScanLine, Ghost, Users, Search, ChevronRight } from "lucide-react";
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

// Placeholder Data
export interface FriendNode {
    id: string;
    address: string;
    isAttending: number;
    topCommunity: string;
    sharedEvents: number;
    // Computed positional properties
    x?: number;
    y?: number;
}

const MOCK_FRIENDS: FriendNode[] = [
    { id: "1", address: "0x7F5...2A9b", isAttending: 2, topCommunity: "eth-chennai", sharedEvents: 10 },
    { id: "2", address: "0x3B...8cD", isAttending: 0, topCommunity: "superteam-india", sharedEvents: 1 },
    { id: "3", address: "0x9E...1f4", isAttending: 1, topCommunity: "blore-dao", sharedEvents: 5 },
    { id: "4", address: "0x1A...4e2", isAttending: 3, topCommunity: "eth-chennai", sharedEvents: 12 },
    { id: "5", address: "0xCc...D31", isAttending: 0, topCommunity: "polkadot-in", sharedEvents: 3 },
    { id: "6", address: "0xD4...2f1", isAttending: 0, topCommunity: "eth-chennai", sharedEvents: 15 },
    { id: "7", address: "0x8E...9a4", isAttending: 1, topCommunity: "superteam-india", sharedEvents: 2 },
];

const MOCK_FRIENDS_EVENTS = [
    {
        id: "e1",
        title: "ETH Chennai Dev Meetup",
        date: "Dec 15",
        friendsAttending: ["0x7F5...2A9b", "0x1A...4e2"],
        imageSeed: "event-chennai",
    },
    {
        id: "e2",
        title: "Superteam Winter Mixer",
        date: "Dec 20",
        friendsAttending: ["0x9E...1f4"],
        imageSeed: "event-superteam",
    }
];

export default function FriendsPage() {
    const { ready, authenticated, login, user } = useAuth();
    const [isIncognito, setIsIncognito] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [qrTab, setQrTab] = useState<'my-code' | 'scan'>('my-code');

    // State for interactive graph nodes
    const [friendsGraph, setFriendsGraph] = useState<FriendNode[]>([]);

    // React Flow States
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    const [selectedFriend, setSelectedFriend] = useState<FriendNode | null>(null);
    const [hoveredEdgeData, setHoveredEdgeData] = useState<{ x: number, y: number, friend: FriendNode, events: any[] } | null>(null);

    const handleEdgeMouseEnter = (e: React.MouseEvent, edge: Edge) => {
        const friendId = edge.target;
        const friend = MOCK_FRIENDS.find(f => f.id === friendId);
        if (!friend) return;
        const shared = MOCK_FRIENDS_EVENTS.filter(ev => ev.friendsAttending.includes(friend.address));
        setHoveredEdgeData({
            x: e.clientX,
            y: e.clientY,
            friend,
            events: shared
        });
    }

    const handleEdgeMouseLeave = () => {
        setHoveredEdgeData(null);
    }

    const handleEdgeClick = (e: React.MouseEvent, edge: Edge) => {
        const friendId = edge.target;
        const friend = MOCK_FRIENDS.find(f => f.id === friendId);
        if (!friend) return;
        setSelectedFriend(friend);
    }

    const walletAddress = user?.wallet?.address ?? (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as { address: string } | undefined)?.address ?? "0x000...000";

    // Calculate Radial Clustering Physics when the component mounts
    useEffect(() => {
        const maxShared = Math.max(...MOCK_FRIENDS.map(f => f.sharedEvents));

        const nodesWithPositions = MOCK_FRIENDS.map((friend, index) => {
            // Distance logic: Closer = more shared events
            const strengthRatio = friend.sharedEvents / maxShared;
            const radiusOffset = 15; // Minimum distance % from center
            const spread = 25; // Max distance spread %
            const radius = radiusOffset + ((1 - strengthRatio) * spread);

            // Distribute evenly in a circle to prevent overlap
            const angle = (index / MOCK_FRIENDS.length) * Math.PI * 2;

            // Calculate X/Y percentages from the center (50, 50)
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            return {
                ...friend,
                x,
                y
            };
        });

        setFriendsGraph(nodesWithPositions);

        // Convert to React Flow Nodes & Edges
        const flowNodes: Node[] = nodesWithPositions.map((f) => ({
            id: f.id,
            position: { x: (f.x / 100) * 800 - 400, y: (f.y / 100) * 800 - 400 },
            data: { label: f.address, friend: f, setSelectedFriend, MOCK_FRIENDS },
            type: 'friendNode',
        }));

        // Add Center Node (User)
        flowNodes.push({
            id: 'center-user',
            position: { x: 0, y: 0 },
            data: { label: 'You', userAddress: walletAddress },
            type: 'userNode',
        });

        const flowEdges: Edge[] = nodesWithPositions.map((f) => {
            const strengthRatio = f.sharedEvents / maxShared;
            return {
                id: `e-center-${f.id}`,
                source: 'center-user',
                target: f.id,
                interactionWidth: 25,
                style: {
                    stroke: `rgba(255,82,162,${0.2 + (strengthRatio * 0.6)})`,
                    strokeWidth: 2 + (strengthRatio * 4),
                    strokeDasharray: strengthRatio > 0.5 ? "none" : "10 5",
                    cursor: 'pointer'
                },
                animated: strengthRatio > 0.5
            };
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
    }, [walletAddress]);

    if (!ready) {
        return (
            <div className="min-h-screen bg-black">
                <Header />
                <div className="flex min-h-[60vh] items-center justify-center">
                    <p className="text-white/50 animate-pulse font-bold tracking-widest uppercase text-sm">Locating Network...</p>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-black flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-24 mx-auto max-w-lg w-full text-center">
                    <div className="w-24 h-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-8">
                        <Users className="w-10 h-10 text-white/40" />
                    </div>
                    <h1 className="font-malinton text-4xl font-black text-white mb-4">CONNECT IDENTITY</h1>
                    <p className="text-white/60 mb-8 font-medium">
                        Connect your wallet to find your friends, see where they're going, and build your social graph.
                    </p>
                    <Button onClick={login} size="lg" className="w-full h-14 bg-primary text-black font-bold hover:bg-primary/90 text-lg">
                        Connect Wallet
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black overflow-x-hidden flex flex-col relative">
            <Header />

            {/* Brutalist Abstract Background Art */}
            <div className="absolute top-0 right-0 w-full max-w-lg h-[600px] bg-secondary/10 blur-[140px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full max-w-lg h-[400px] bg-primary/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

            {/* Main Content Area */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 w-full max-w-md mx-auto px-4 pt-28 pb-32 flex flex-col relative z-10"
            >
                {/* Header & Incognito Toggle */}
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

                {/* Content View State */}
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
                                You are currently hidden from the network. While incognito, you cannot see your friends' stats or events.
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
                            {/* Network Graph Placeholder */}
                            <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden relative h-[350px]">
                                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                                    <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">Your Graph</p>
                                    <p className="text-white text-xl font-black">{MOCK_FRIENDS.length} Connections</p>
                                </div>

                                {/* Find Friends Button overlay */}
                                <div className="absolute top-4 right-4 z-10">
                                    <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/5 backdrop-blur-md">
                                        <Search className="w-4 h-4 text-white" />
                                    </button>
                                </div>

                                {/* React Flow Interactive Grid */}
                                <div className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing">
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        nodeTypes={{
                                            userNode: ({ data }: any) => (
                                                <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-primary bg-black shadow-[0_0_30px_rgba(255,82,162,0.6)] relative">
                                                    <Handle type="source" position={Position.Top} className="opacity-0 w-1 h-1" />
                                                    <Handle type="target" position={Position.Bottom} className="opacity-0 w-1 h-1" />
                                                    <PatternGraphic seed={data.userAddress} variant="pink" />
                                                </div>
                                            ),
                                            friendNode: ({ data }: any) => {
                                                const friend = data.friend;
                                                const mockFriends = data.MOCK_FRIENDS;
                                                const selectFn = data.setSelectedFriend;

                                                const maxShared = Math.max(...mockFriends.map((f: any) => f.sharedEvents));
                                                const strengthRatio = friend.sharedEvents / maxShared;
                                                const avatarScale = 1 + (strengthRatio * 0.3);

                                                return (
                                                    <div
                                                        className="relative cursor-pointer transition-transform duration-200 hover:scale-[1.2] hover:z-50 group"
                                                        style={{ transform: `scale(${avatarScale})` }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            selectFn(friend);
                                                        }}
                                                    >
                                                        <Handle type="target" position={Position.Top} className="opacity-0 w-1 h-1" />
                                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-black group-hover:border-primary/80 group-hover:shadow-[0_0_20px_rgba(255,82,162,0.4)] transition-all">
                                                            <PatternGraphic seed={friend.address} variant="beige" />
                                                        </div>
                                                        {friend.isAttending > 0 && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-[3px] border-[#141414] shadow-[0_0_10px_rgba(255,82,162,1)]" />
                                                        )}
                                                    </div>
                                                )
                                            }
                                        }}
                                        onEdgeMouseEnter={handleEdgeMouseEnter}
                                        onEdgeMouseLeave={handleEdgeMouseLeave}
                                        onEdgeClick={handleEdgeClick}
                                        fitView
                                        maxZoom={1.5}
                                        minZoom={0.5}
                                        proOptions={{ hideAttribution: true }}
                                    >
                                        <Background color="#ffffff05" variant={BackgroundVariant.Dots} gap={20} size={1} />
                                    </ReactFlow>
                                </div>

                                {/* Tooltip on hover */}
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 px-2 py-1 rounded-md text-[10px] text-white whitespace-nowrap pointer-events-none z-50">
                                    Graph Nodes
                                </div>
                            </div>

                            {/* Friends Events Feed */}
                            <div className="flex flex-col gap-4">
                                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Friends are attending</p>

                                {MOCK_FRIENDS_EVENTS.map((event) => (
                                    <div key={event.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/10 transition-colors">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black border border-white/10">
                                            <PatternGraphic seed={event.imageSeed} variant="beige" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-bold truncate">{event.title}</h3>
                                            <p className="text-white/50 text-xs mt-1">{event.date}</p>

                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex -space-x-2">
                                                    {event.friendsAttending.map((address, i) => (
                                                        <div key={i} className="w-5 h-5 rounded-full overflow-hidden border border-black bg-black">
                                                            <PatternGraphic seed={address} variant="beige" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                                                    {event.friendsAttending.length} Friend{event.friendsAttending.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Edge Hover Tooltip */}
            <AnimatePresence>
                {hoveredEdgeData && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed z-[100] bg-black border border-white/20 p-4 rounded-2xl shadow-2xl w-56 pointer-events-none"
                        style={{ left: hoveredEdgeData.x + 15, top: hoveredEdgeData.y + 15 }}
                    >
                        <Badge variant="secondary" className="mb-3 bg-primary/20 text-primary border-primary/30 tracking-widest text-[9px] uppercase font-bold">
                            {hoveredEdgeData.friend.sharedEvents} Shared Events
                        </Badge>
                        <div className="flex flex-col gap-2">
                            {hoveredEdgeData.events.length > 0 ? (
                                hoveredEdgeData.events.map(ev => (
                                    <div key={ev.id} className="text-white text-xs font-medium truncate flex items-center gap-2">
                                        <div className="min-w-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                                        {ev.title}
                                    </div>
                                ))
                            ) : (
                                <div className="text-white/40 text-xs italic">No specific events logged</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Friend Details Modal Overlay */}
            <AnimatePresence>
                {selectedFriend && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedFriend(null)}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4"
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

                            {/* Mobile Drag Handle Placeholder */}
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 sm:hidden" />

                            <div className="flex items-center gap-5 mb-8 relative z-10">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/50 bg-black shrink-0 relative shadow-[0_0_20px_rgba(255,82,162,0.3)]">
                                    <PatternGraphic seed={selectedFriend.address} variant="beige" />
                                </div>
                                <div>
                                    <Badge variant="secondary" className="mb-2 bg-primary/20 text-primary border-primary/30 tracking-widest text-[10px] uppercase font-bold">
                                        {selectedFriend.sharedEvents} Shared Events
                                    </Badge>
                                    <h3 className="text-xl font-bold text-white font-mono">{selectedFriend.address}</h3>
                                    <p className="text-white/50 text-sm mt-1">Top Community <span className="text-white font-semibold">#{selectedFriend.topCommunity}</span></p>
                                </div>
                            </div>

                            {/* Shared Events List */}
                            <div className="mb-6">
                                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-3">Matching Events</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {MOCK_FRIENDS_EVENTS.filter(ev => ev.friendsAttending.includes(selectedFriend.address)).length > 0 ? (
                                        MOCK_FRIENDS_EVENTS.filter(ev => ev.friendsAttending.includes(selectedFriend.address)).map(ev => (
                                            <div key={ev.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-black">
                                                    <PatternGraphic seed={ev.imageSeed} variant="beige" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-white text-sm font-bold truncate">{ev.title}</p>
                                                    <p className="text-white/40 text-xs">{ev.date}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-white/40 text-xs italic">No specific events logged</p>
                                    )}
                                </div>
                            </div>

                            <Button
                                className="w-full bg-white text-black hover:bg-gray-200 font-bold tracking-wide h-12 text-sm rounded-xl mb-3"
                                onClick={() => setSelectedFriend(null)}
                            >
                                View Full Profile
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

            {/* Floating Action Button - Scan QR */}
            <AnimatePresence>
                {
                    !isIncognito && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-32 right-4 z-[60] md:hidden"
                        >
                            <button
                                onClick={() => { setShowQR(true); setQrTab('my-code'); }}
                                className="w-14 h-14 rounded-full bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                            >
                                <QrCode className="w-6 h-6" />
                            </button>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* QR Code Modal Overlay */}
            <AnimatePresence>
                {
                    showQR && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                        >
                            <div
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                onClick={() => setShowQR(false)}
                            />
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-[#141414] border border-white/10 rounded-[2rem] p-6 w-full max-w-sm relative z-10 shadow-2xl"
                            >
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white/5 rounded-full p-1 flex">
                                        <button
                                            onClick={() => setQrTab('my-code')}
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
                                                viewBox={`0 0 256 256`}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-malinton text-2xl font-bold text-white mb-1">Add Friend</h3>
                                            <p className="text-white/50 text-sm">Scan this code to add me to your network.</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 aspect-square mb-6 relative">
                                            <Scanner
                                                onScan={(result: IDetectedBarcode[]) => {
                                                    if (result && result.length > 0) {
                                                        console.log("Scanned friend code:", result[0].rawValue);
                                                        // Handle add friend logic here
                                                        setShowQR(false);
                                                    }
                                                }}
                                                formats={['qr_code']}
                                                styles={{ container: { width: '100%', height: '100%' } }}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-malinton text-2xl font-bold text-white mb-1">Scan Code</h3>
                                            <p className="text-white/50 text-sm">Point your camera at a friend's Clink QR code.</p>
                                        </div>
                                    </>
                                )}

                                <Button
                                    onClick={() => setShowQR(false)}
                                    className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white rounded-xl h-12"
                                >
                                    Close
                                </Button>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </div>
    );
}
