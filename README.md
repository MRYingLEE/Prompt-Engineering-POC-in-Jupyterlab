# Prompt-Engineering-POC-in-Jupyterlab

This POC uses the framework of https://github.com/jflam/chat-gpt-jupyter-extension to test Jupyterlab-specific Prompt Engineering ideas.

## Core Prompt definitions
```Python
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
```
## The core part to prepare Python code context
The most tricky way to prepare the context for the prompt is to generate the current information on all Pandas data frames.
1. A function named "get_df_defines()" in string is created
2. The function in string is defined by the execution the string in Python kernal.
3. The defined function is called every time when we need the context on all Pandas data frames.

```Python
						const pythonCode = 
						`def get_df_defines():\n \
						  	lines=["import pandas as pd", ""]\n \
							dfs_only = {k: v for k, v in globals().items() if isinstance(v, pd.DataFrame)}\n \
							for df_name, df in dfs_only.items():\n \
								cols=','.join(['"'+c+'"' for c in df.columns])\n \
								dts=','.join(['"'+c+'" : "'+str(t)+'"' for c, t in zip(df.columns,df.dtypes)])\n \
								lines.append(df_name+'=pd.read_csv("'+df_name+'.csv", columns={'+cols+'}, dtype={'+ dts + '})')\n \
							return '\n'.join(lines)\n \
						get_df_defines()`;

						const pythonCode = "get_df_defines()";

						const getUserPromptPromise = function (parsedCell) {
							return window.executePython(pythonCode).then((result) => {
								parsedCell.codeContext = "The following Python code has been developed:\n```Python\n" + result + "\n```\n" +
									"Please append some Pythonic Python code to solve the following task. Please don't recreate the dataframes. \n";
								const prompt = parsedCell.codeContext + getUserPrompt(parsedCell);

								return prompt;
							});
						};
```
      
