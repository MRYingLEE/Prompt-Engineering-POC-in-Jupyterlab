(() => {
	// src/content-script/inject.js
	(() => {
		(() => {
			(() => {
				(() => {
					(function () {
						const parseHeader = /^\s*\#\#\#\#\#\s*(chat|prompt|response):?\s*(.*)$/;
						const parseSwitch = /^\s*\/(nochain|prompt):?\s*(.*)$/;
						const parseChat = /(?<!\S)@(?:(?!\bchat\b)[\w'])*\bchat\b(?!\S)/;
						let actions = {
							"Python": {
								"systemPrompt": "You are a data scientist.You are good at coding Pythonic style Python in Jupyter Notebook. When I give you a task, try to generate pure Python code to solve it.You may add comments within code, but do not explain out of code.",
								"codeContext": true
							},
							"2E": {
								"systemPrompt": "I want you to act as an English translator,spelling corrector and improver. I will speak to you in any languageand you will detect the language, translate it and answer in the corrected and improved version of my text, in English. I want you to replace my simplified A0-level words and sentenceswith more beautiful and elegant, upper level English words and sentences. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations. ",
								"codeContext": false
							},
							"2C": {
								"systemPrompt": "I want you to act as an Chinese translator,spelling corrector and improver. I will speak to you in any languageand you will detect the language, translate it and answer in the corrected and improved version of my text, in Chinese. I want you to replace my simplified A0-level words and sentenceswith more beautiful and elegant, upper level Chinese words and sentences. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations. ",
								"codeContext": false
							}
						};
						const parseCell = function (cell) {
							let result = {};
							let lines = cell.get_text().split(/\r?\n/);
							let contents = [];
							if (lines.length < 1) {
								result.cell_type = "unknown";
								return result;
							} else {
								lines.forEach((line) => {
									isChat = false;
									const matchChat = line.match(parseChat);
									if (matchChat) {
										if (matchChat) {
											result.cell_type = "chat";
											result.thread = line.replace(parseChat, "");
											console.log(result.thread);
											isChat = true;
										}
									}
									if (!isChat) {
										for (const key in actions) {
											let parseAction = new RegExp(/(?<!\S)@(?:(?!\bchat\b)[\w'])*\bchat\b(?!\S)/.source.replace(/chat/g, key));
											let matchAction = line.match(parseAction);
											if (matchAction) {
												result.action = key;
												result.cell_type = "chat";
												result.thread = line.replace(parseAction, "");
												console.log(result.thread);
												isChat = true;
												break;
											}
										}
									}
									if (!isChat) {
										const matches = line.match(parseHeader);
										if (matches) {
											const [, key, value] = matches;
											if (key === "chat") {
											} else if (key === "prompt") {
												result.cell_type = "prompt";
												result.prompt = value.trim();
											} else if (key === "response") {
												result.cell_type = "response";
											}
										} else {
											const switchMatches = line.match(parseSwitch);
											if (switchMatches) {
												const [, key, value] = switchMatches;
												if (key === "nochain") {
													result.chain = false;
												} else if (key === "prompt") {
													result.prompt = value.trim();
												}
											} else {
												contents.push(line);
											}
										}
									}
								});
							}
							const body = contents.join("\n");
							result.text = body;
							if (result.cell_type === "chat") {
								if (result.chain === void 0) {
									result.chain = true;
								}
								if (result.prompt === void 0) {
									result.prompt = "";
								}
								if (result.action) {
									if (actions[result.action]) {
										if (actions[result.action]["systemPrompt"]) {
											result.systemPrompt = actions[result.action]["systemPrompt"];
											console.log("final system message:", result.systemPrompt);
										}
									}
								}
								if (result.cell_type === void 0) {
									result.cell_type = "unknown";
								}
								return result;
							}
						};
						const keywordToProgrammingLanguage = {
							"python": "python",
							"java": "java",
							"c#": "csharp",
							"c sharp": "csharp",
							"javascript": "javascript",
							"f#": "fsharp",
							"php": "php",
							"r": "r"
						};
						const detector = new RegExp(`\\b(${Object.keys(keywordToProgrammingLanguage).join("|")})\\b`, "g");
						const detectProgrammingLanguage = function (text) {
							const matches = text.toLowerCase().match(detector);
							const result = Object.values(keywordToProgrammingLanguage).reduce((acc, id) => {
								acc[id] = 0;
								return acc;
							}, {});
							if (matches) {
								matches.forEach((word) => {
									const id = keywordToProgrammingLanguage[word];
									result[id]++;
								});
							}
							const entries = Object.entries(result);
							const sorted = entries.sort((a, b) => b[1] - a[1]);
							const [key, count] = sorted.find(([key2, count2]) => count2 === sorted[0][1]);
							if (count === 0) {
								return "";
							}
							return key;
						};
						const buildQueryContext = function (thread) {
							let result = "";
							const cells = Jupyter.notebook.get_cells();
							const currentCellIndex = Jupyter.notebook.get_selected_index();
							for (let i = currentCellIndex - 1; i >= 0; i--) {
								let cell = cells[i];
								if (cell.metadata.chatgpt_thread === thread) {
									if (cell.metadata.chatgpt_cell !== "raw_response") {
										const parsedCell = parseCell(cell);
										if (cell.metadata.chatgpt_cell === "code") {
											result = "```\n" + parseCell.text + "\n```\n" + result;
										} else {
											const prompt = getUserPrompt(parsedCell);
											result = prompt + "\n" + result;
										}
									}
								}
							}
							return result;
						};
						var prompts = {};
						const dumpParsedCell = function (parsedCell) {
							console.log("cell_type", parsedCell.cell_type);
							console.log("thread", parsedCell.thread);
							console.log("prompt", parsedCell.prompt);
							console.log("nochain", parsedCell.nochain);
							console.log("text", parsedCell.text);
						};

						window.executePython = function (python) {
							return new Promise((resolve, reject) => {
								var callbacks = {
									iopub: {
										output: (data) => resolve(data.content.text.trim())
									}
								};
								Jupyter.notebook.kernel.execute(`print(${python})`, callbacks);
							});
						}

						const getUserPrompt = function (parsedCell) {
							let prompt = parsedCell.text;
							if (!prompt) {
								prompt = parsedCell.thread;
							}
							if (parsedCell.prompt !== "") {
								prompt = prompts[parsedCell.prompt] + prompt;
							}

							return prompt;
						};

						const contextNeeded = function (parsedCell) {
							try {
								if (actions[parsedCell.action]) {
									return actions[parsedCell.action]["codeContext"];
								}

							} catch (error) {
								return false;
							}

							return false;
						}


						// const pythonCode = 
						// `def get_df_defines():\n \
						//   	lines=["import pandas as pd", ""]\n \
						// 	dfs_only = {k: v for k, v in globals().items() if isinstance(v, pd.DataFrame)}\n \
						// 	for df_name, df in dfs_only.items():\n \
						// 		cols=','.join(['"'+c+'"' for c in df.columns])\n \
						// 		dts=','.join(['"'+c+'" : "'+str(t)+'"' for c, t in zip(df.columns,df.dtypes)])\n \
						// 		lines.append(df_name+'=pd.read_csv("'+df_name+'.csv", columns={'+cols+'}, dtype={'+ dts + '})')\n \
						// 	return '\n'.join(lines)\n \
						// get_df_defines()`;

						const pythonCode = "get_df_defines()";

						const getUserPromptPromise = function (parsedCell) {
							return window.executePython(pythonCode).then((result) => {
								parsedCell.codeContext = "The following Python code has been developed:\n```Python\n" + result + "\n```\n" +
									"Please append some Pythonic Python code to solve the following task. Please don't recreate the dataframes. \n";
								const prompt = parsedCell.codeContext + getUserPrompt(parsedCell);

								return prompt;
							});
						};

						const getSystemPrompt = function (parsedCell) {
							let systemPrompt = "";
							if (actions[parsedCell.action]) {
								if (actions[parsedCell.action]["systemPrompt"]) {
									systemPrompt = actions[parsedCell.action]["systemPrompt"];
								}
							}
							return systemPrompt;
						};
						const sendToChatGPT = function () {
							let cell = Jupyter.notebook.get_selected_cell();
							const parsedCell = parseCell(cell);
							if (!parsedCell || !parsedCell.cell_type) {
								cell.execute();
								Jupyter.notebook.select_next();
								return false;
							}
							if (parsedCell.cell_type === "chat") {
								cell.metadata.chatgpt_cell = "query";
								cell.metadata.chatgpt_thread = parsedCell.thread;
								cell.metadata.chatgpt_language = parsedCell.language;
								let systemPrompt = getSystemPrompt(parsedCell);
								let context = "";
								if (parsedCell.chain) {
									context = buildQueryContext(parsedCell.thread);
								}
								// let query = context + "\n" + prompt;
								let language = ""; // detectProgrammingLanguage(userPrompt);
								if (contextNeeded(parsedCell)) {
									getUserPromptPromise(parsedCell).then((userPrompt) => {
										window.postMessage({
											type: "QUERY_CHATGPT",
											//codeContext: parsedCell.codeContext,
											// ToDOlist: To replace faked code off
											userPrompt,
											systemPrompt,
											language,
											thread: parsedCell.thread
										}, "*");
										cell.render();
									});
								}
								else {
									const userPrompt = getUserPrompt(parsedCell);
									window.postMessage({
										type: "QUERY_CHATGPT",
										userPrompt,
										systemPrompt,
										language,
										thread: parsedCell.thread
									}, "*");
									cell.render();
								}

							} else if (parsedCell.cell_type === "prompt") {
								prompts[parsedCell.prompt] = parsedCell.text;
								cell.render();
							} else {
								cell.execute();
								Jupyter.notebook.select_next();
							}
							return false;
						};
						const insertChatCell = function (above) {
							if (above) {
								Jupyter.notebook.insert_cell_above();
								Jupyter.notebook.select_prev();
							} else {
								Jupyter.notebook.insert_cell_below();
								Jupyter.notebook.select_next();
							}
							Jupyter.notebook.cells_to_markdown();
							Jupyter.notebook.get_selected_cell().set_text("##### chat\n");
							Jupyter.notebook.get_selected_cell().focus_editor();
						};
						const newChatCellAbove = function () {
							insertChatCell(true);
							return false;
						};
						const newChatCellBelow = function () {
							insertChatCell(false);
							return false;
						};
						const extractCodeBlocks = function (language, response) {
							if (language === "") {
								return [response, []];
							}
							let lines = response.split("\n");
							let inCodeBlock = false;
							let annotatedResponse = [];
							let currentBlock = [];
							let codeBlocks = [];
							for (const line of lines) {
								if (line !== "") {
									if (line.startsWith("```")) {
										inCodeBlock = !inCodeBlock;
										if (inCodeBlock) {
											annotatedResponse.push("```" + language);
										} else {
											annotatedResponse.push("```");
											codeBlocks.push(currentBlock.join("\n"));
											currentBlock = [];
										}
									} else {
										if (inCodeBlock) {
											currentBlock.push(line);
										}
										annotatedResponse.push(line);
									}
								}
							}
							if (codeBlocks.length === 0 && language !== "") {
								const code = annotatedResponse.join("\n");
								currentBlock.push(`\`\`\`${language}`);
								currentBlock.push(code);
								currentBlock.push("```");
								codeBlocks.push(code);
								return [currentBlock.join("\n"), codeBlocks];
							} else {
								return [annotatedResponse.join("\n"), codeBlocks];
							}
						};
						const formatDate = function () {
							var now = new Date();
							var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];
							var time = [now.getHours(), now.getMinutes(), now.getSeconds()];
							var suffix = time[0] < 12 ? "AM" : "PM";
							time[0] = time[0] < 12 ? time[0] : time[0] - 12;
							time[0] = time[0] || 12;
							for (var i = 1; i < 3; i++) {
								if (time[i] < 10) {
									time[i] = "0" + time[i];
								}
							}
							return date.join("/") + " " + time.join(":") + " " + suffix;
						};
						const waiting_msg = "##### response: waiting for ChatGPT to respond...";
						var start_time = new Date();
						var currentStreamingCell = null;
						var fulltext = "";
						window.addEventListener("message", function (event) {
							if (event.data.type && event.data.type === "BEGIN_CONTENT_SCRIPT") {
								Jupyter.notebook.insert_cell_below();
								Jupyter.notebook.select_next();
								Jupyter.notebook.cells_to_markdown();
								start_time = new Date();
								fulltext = "";
								currentStreamingCell = Jupyter.notebook.get_selected_cell();
								currentStreamingCell.set_text(waiting_msg);
							} else if (event.data.type && event.data.type === "STREAM_CONTENT_SCRIPT") {
								var response = fulltext + event.data.text;
								fulltext = response;
								console.log("STREAM_CONTENT_SCRIPT begin");
								var current_time = new Date();
								var time_difference = current_time - start_time;
								var seconds = Math.floor(time_difference / 1e3);
								// Prepend the ChatGPT response with the time elapsed

								// response.replaceWith()

								var msg = `##### response: ${seconds} seconds elapsed\n\n${response}`;
								if (currentStreamingCell) {
									currentStreamingCell.set_text(msg);
								} else {
									console.log("currentStreamingCell is null");
								}
							} else if (event.data.type && event.data.type === "END_CONTENT_SCRIPT") {
								let language = event.data.language;
								let thread = event.data.thread;
								fulltext = "";
								let text = currentStreamingCell.get_text();
								text = text.replace(/^\#\#\#\#\# response.*\n/, "");
								const [annotatedResponse, codeBlocks] = extractCodeBlocks(language, text);
								const elapsed_time = Math.floor((new Date() - start_time) / 1e3);
								if (thread !== "") {
									thread = `in thread ${thread}`;
								}
								var summary = `##### response generated ${thread} by ChatGPT in ${elapsed_time} seconds at ${formatDate(start_time)}
`;
								currentStreamingCell.select();
								currentStreamingCell.set_text(summary + annotatedResponse);
								currentStreamingCell.render();
								const index = Jupyter.notebook.find_cell_index(currentStreamingCell);
								Jupyter.notebook.select(index);
								for (var i = 0; i < codeBlocks.length; i++) {
									Jupyter.notebook.insert_cell_below();
									Jupyter.notebook.select_next();
									let cell = Jupyter.notebook.get_selected_cell();
									cell.metadata.chatgpt_cell = "code";
									cell.metadata.chatgpt_language = language;
									cell.metadata.chatgpt_thread = thread;
									cell.set_text(codeBlocks[i]);
								}
							} else if (event.data.type && event.data.type === "ERROR_LOGIN_CONTENT_SCRIPT") {
								currentStreamingCell.set_text("Please login to [ChatGPT first](https://chat.openai.com)");
								currentStreamingCell.render();
							}
						});

						if (Jupyter) {
							let keyboard_manager = Jupyter?.notebook?.keyboard_manager;

							while (keyboard_manager == null) {
								setTimeout(() => {
									keyboard_manager = Jupyter?.notebook?.keyboard_manager;

									console.log("sleep 2000ms");
								}, 2e3);
							}
							const sendToChatGptAction = {
								icon: "fa-comments",
								help: "Send to ChatGPT",
								handler: sendToChatGPT
							};
							const sendToChatGptActionName = keyboard_manager.actions.register(
								sendToChatGptAction,
								"send-to-chatgpt",
								"auto"
							);
							const newChatCellAboveAction = {
								icon: "fa-level-up",
								help: "New ChatGPT Cell Above",
								handler: newChatCellAbove
							};
							const newChatCellBelowAction = {
								icon: "fa-level-down",
								help: "New ChatGPT Cell Below",
								handler: newChatCellBelow
							};
							const newChatCellAboveActionName = keyboard_manager.actions.register(
								newChatCellAboveAction,
								"new-chatgpt-cell-above",
								"auto"
							);
							const newChatCellBelowActionName = keyboard_manager.actions.register(
								newChatCellBelowAction,
								"new-chatgpt-cell-below",
								"auto"
							);
							keyboard_manager.edit_shortcuts.add_shortcut(
								"shift-enter",
								sendToChatGptActionName
							);
							keyboard_manager.command_shortcuts.add_shortcut(
								"shift-c",
								newChatCellAboveActionName
							);
							keyboard_manager.command_shortcuts.add_shortcut(
								"c",
								newChatCellBelowActionName
							);
							Jupyter.toolbar.add_buttons_group([
								sendToChatGptActionName,
								newChatCellAboveActionName,
								newChatCellBelowActionName
							]);
						}

						console.log("Im in yr page, injecting scripts");
					})();
				})();
			})();
		})();
	})();
})();
