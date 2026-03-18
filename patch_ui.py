import os

file_path = "frontend/src/app/page.tsx"

with open(file_path, "r") as f:
    lines = f.readlines()

# We need to replace from line 256 to 416
start_idx = 255 # 0-indexed
end_idx = 416

new_code = """                  {/* MIDDLE COLUMN: Actions & Diagnostics */}
                  <div className="lg:col-span-3 flex flex-col gap-4">
                    {/* Action Box */}
                    <div className="bg-[#1c2331] border border-[#2c374c] rounded-xl p-6 flex flex-col items-center justify-center shadow-lg relative overflow-hidden flex-shrink-0">
                       <button
                          onClick={runRefinery}
                          disabled={isCleaning}
                          className="relative z-10 bg-white hover:bg-gray-100 text-slate-800 font-semibold px-6 py-2.5 rounded hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg w-full text-sm disabled:opacity-50"
                       >
                         {isCleaning ? "Cleaning Data..." : "🚀 Approve & Refine Data"}
                       </button>
                    </div>

                    {/* AI Diagnostics Box */}
                    <div className="bg-[#1c2331] border border-[#2c374c] rounded-xl flex flex-col flex-1 shadow-lg overflow-hidden relative">
                      <div className="px-4 py-3 border-b border-[#2c374c] bg-[#222a3a] flex flex-col justify-between">
                        <h3 className="text-sm font-semibold text-slate-200 mb-1">AI Diagnostics</h3>
                        <p className="text-[11px] text-slate-400">Streaming log report</p>
                      </div>
                      <div className="p-4 flex-1 flex flex-col min-h-[250px] relative">
                        {!diagnosticReport && !isAnalyzing ? (
                           <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                              <button 
                                 onClick={runDiagnostics} 
                                 className="px-4 py-2 bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 rounded text-xs transition-colors border border-blue-500/20"
                              >
                                 Run Diagnosis
                              </button>
                           </div>
                        ) : isAnalyzing ? (
                           <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                              <div className="w-5 h-5 flex gap-1 items-center justify-center">
                                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></div>
                                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></div>
                              </div>
                              Analyzing patterns...
                           </div>
                        ) : (
                           <div className="flex-1 overflow-auto text-[11px] text-slate-300 font-mono leading-relaxed pb-8">
                              {diagnosticReport?.split('\\n').filter(bool).map((line, i) => (
                                <div key={i} className="mb-1.5 flex gap-2">
                                  <span className="text-slate-500">•</span>
                                  <span dangerouslySetInnerHTML={{__html: line.replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="text-blue-300">$1</strong>')}}></span>
                                </div>
                              ))}
                           </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-[#161c27] border border-[#2c374c] p-2 rounded text-[10px] text-slate-500 shadow">
                           <input type="text" placeholder="Streaming Log..." className="bg-transparent border-none flex-1 outline-none text-white px-1" disabled />
                           <svg className="w-3 h-3 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Comparison & Chat */}
                  <div className="lg:col-span-6 flex flex-col gap-4">
                    {/* Comparison View Box */}
                    <div className="bg-[#1c2331] border border-[#2c374c] rounded-xl flex flex-col shadow-lg overflow-hidden h-[350px]">
                       <div className="px-0 py-0 border-b border-[#2c374c] bg-[#1a202c] flex items-center">
                         <div className="flex items-center gap-2 px-4 py-3 text-slate-400 border-r border-[#2c374c] text-[13px] bg-[#161c27]">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                           <span>Tab Data /</span>
                         </div>
                         <div className="bg-[#1e3a5f] text-white px-4 py-3 text-[13px] border-r border-[#2c374c] font-medium shadow-[inset_0_-2px_0_#3b82f6]">
                           Comparison View
                         </div>
                       </div>
                       <div className="flex-1 flex overflow-hidden">
                         {/* Raw Table */}
                         <div className="flex-1 flex flex-col border-r border-[#2c374c] relative overflow-hidden min-w-0">
                           <div className="p-3 pb-1">
                             <h4 className="text-xs font-semibold text-slate-200">Raw Data</h4>
                             <p className="text-[10px] text-slate-400 mb-2">{activeDataset.shape[0].toLocaleString()} Rows × {activeDataset.shape[1]} Columns</p>
                           </div>
                           <div className="flex-1 overflow-auto bg-[#161c27]">
                             <table className="w-full text-left text-slate-300 text-[10px] whitespace-nowrap">
                               <thead className="bg-[#1c2331] text-slate-400 sticky top-0 shadow-sm border-y border-[#2c374c]">
                                 <tr>
                                   {activeDataset.fingerprint.columns.slice(0, 5).map((col: string, i: number) => (
                                     <th key={i} className={`px-2 py-1.5 font-medium border-x border-[#2c374c] ${i===0?'border-l-0':''}`}>{col}</th>
                                   ))}
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-[#2c374c]">
                                 {activeDataset.fingerprint.safe_sample.map((row: any, i: number) => (
                                   <tr key={i} className="hover:bg-[#1a202c]">
                                     {activeDataset.fingerprint.columns.slice(0, 5).map((col: string, j: number) => (
                                       <td key={j} className={`px-2 py-1.5 border-x border-[#2c374c]/50 truncate max-w-[80px] ${j===0?'border-l-0':''}`}>{String(row[col])}</td>
                                     ))}
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         </div>
                         {/* Cleaned Table */}
                         <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">
                           <div className="p-3 pb-1">
                             <h4 className="text-xs font-semibold text-slate-200">Cleaned Data</h4>
                             <p className="text-[10px] text-slate-400 mb-2">
                               {cleanedDataset ? `${cleanedDataset.shape[0].toLocaleString()} Rows × ${cleanedDataset.shape[1]} Columns` : 'Approve to view'}
                             </p>
                           </div>
                           <div className="flex-1 overflow-auto bg-[#161c27]">
                              {!cleanedDataset ? (
                                 <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500 p-4 text-center pb-20">
                                    No cleaned data yet.
                                 </div>
                              ) : (
                                <table className="w-full text-left text-slate-300 text-[10px] whitespace-nowrap">
                                  <thead className="bg-[#1c2331] text-slate-400 sticky top-0 shadow-sm border-y border-[#2c374c]">
                                    <tr>
                                      {cleanedDataset.fingerprint.columns.slice(0, 5).map((col: string, i: number) => (
                                        <th key={i} className={`px-2 py-1.5 font-medium border-x border-[#2c374c] ${i===0?'border-l-0':''}`}>{col}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#2c374c]">
                                    {cleanedDataset.fingerprint.safe_sample.map((row: any, i: number) => (
                                      <tr key={i} className="hover:bg-[#1a202c]">
                                        {cleanedDataset.fingerprint.columns.slice(0, 5).map((col: string, j: number) => (
                                          <td key={j} className={`px-2 py-1.5 border-x border-[#2c374c]/50 truncate max-w-[80px] ${j===0?'border-l-0':''}`}>{String(row[col])}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                           </div>
                         </div>
                       </div>
                    </div>

                    {/* Chat View Box */}
                    <div className="bg-[#1c2331] border border-[#2c374c] rounded-xl flex flex-col flex-1 shadow-lg overflow-hidden min-h-[350px]">
                       <div className="px-4 py-3 border-b border-[#2c374c] bg-[#222a3a] flex items-center gap-2">
                         <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2m0 14H6l-2 2V4h16z"></path></svg>
                         <h3 className="text-sm font-semibold text-slate-200">Chat with AI - Julius</h3>
                       </div>
                       <div className="flex-1 flex flex-col relative bg-[#131924]">
                          <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                                {msg.role === 'assistant' && (
                                  <div className="w-6 h-6 rounded flex-shrink-0 bg-blue-600/20 text-blue-500 flex items-center justify-center mr-2 mt-1 shadow-sm border border-blue-500/20">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg>
                                  </div>
                                )}
                                <div
                                  className={`max-w-[80%] text-[11px] leading-relaxed relative ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white px-3 py-2 rounded-lg rounded-tr-sm shadow-md'
                                    : 'text-slate-300 py-1'
                                    }`}
                                >
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                              </div>
                            ))}
                            {cleanedDataset && (
                               <div className="flex justify-start w-full">
                                  <div className="w-6 h-6 rounded flex-shrink-0 bg-blue-600/20 text-blue-500 flex items-center justify-center mr-2 mt-1 shadow-sm border border-blue-500/20">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg>
                                  </div>
                                  <div className="max-w-[80%] text-[12px] text-slate-300 bg-[#1c2331] border border-[#2c374c] px-4 py-3 rounded-lg shadow-sm">
                                     <p className="mb-3">Your data has been cleaned. Click the button below to download.</p>
                                     <button
                                        onClick={() => {
                                          window.open(`http://localhost:8000/api/downloads/${cleanedDataset.file_path}`, '_blank');
                                        }}
                                        className="bg-[#1e2736] hover:bg-[#252f3f] border border-[#3b82f6] text-blue-400 font-medium text-[11px] px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shadow mx-auto w-fit"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        Download Cleaned CSV
                                      </button>
                                  </div>
                               </div>
                            )}
                            {isTyping && (
                              <div className="flex justify-start">
                                <div className="w-6 h-6 rounded flex-shrink-0 bg-blue-600/20 text-blue-500 flex items-center justify-center mr-2 mt-1 shadow-sm">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg>
                                </div>
                                <div className="py-2 flex gap-1 items-center h-6">
                                  <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></div>
                                  <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Chat Input Bar */}
                          <div className="p-3 bg-[#161c27] border-t border-[#2c374c]">
                            <form onSubmit={handleSendMessage} className="relative flex flex-col bg-[#1c2331] border border-[#2c374c] rounded-lg focus-within:border-[#4A4A4A] transition-colors p-2 shadow-inner">
                              <div className="flex items-center gap-3 mb-2 px-1 border-b border-[#2c374c]/50 pb-2">
                                 <button type="button" className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                    Connectors
                                 </button>
                                 <button type="button" className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                                    Tools
                                 </button>
                              </div>
                              <div className="flex items-center pr-1">
                                  <textarea
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e as any);
                                      }
                                    }}
                                    placeholder="Clean and transform my dataset..."
                                    className="flex-1 bg-transparent resize-none py-1 pl-1 text-[12px] text-slate-200 focus:outline-none min-h-[24px] max-h-[100px] placeholder:text-slate-500"
                                    disabled={isTyping}
                                    rows={1}
                                  />
                                  <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isTyping}
                                    className="p-1 mb-0.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#2c374c] disabled:text-slate-500 text-white rounded transition-colors flex-shrink-0"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                                    </svg>
                                  </button>
                              </div>
                            </form>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
"""

new_lines = lines[:start_idx] + [new_code] + lines[end_idx:]

with open(file_path, "w") as f:
    f.writelines(new_lines)

print("Patching complete!")
