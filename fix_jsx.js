const fs = require('fs');
const filePath = './src/app/friends/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The file currently has a malformed block around line 288:
//                         </motion.div>
//                     ))}
//                 </div>
//         </div>

// It should be:
//                                 </div>
//                             </div>
//                         </motion.div>
//                     )}
//                 </AnimatePresence>
//             </motion.div>

content = content.replace(
    /                                        \)\n  \s* \}\)\}\n \s* <\/div>\n\n \s* \{\/\* Tooltip on hover \*\/\}\n \s* <div className="absolute top-12 left-1\/2 -translate-x-1\/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white\/10 px-2 py-1 rounded-md text-\[10px\] text-white whitespace-nowrap pointer-events-none z-50">\n \s* \{friend\.address\}\n \s* <\/div>\n \s* <\/div>\n \s* <\/motion\.div>\n \s* \}\)\}\n \s* <\/div>\n \s* <\/div>/g,
    `                                        )
                                    })}
                                </div>
                            </div>`
);

// We will also insert the missing modal right before the floating action button
content = content.replace(
    /    \{\/\* Floating Action Button - Scan QR \*\/\s*\}/,
    \`
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
    \`
);

fs.writeFileSync(filePath, content);
