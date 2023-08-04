# Prompt-Engineering-POC-in-Jupyterlab

This POC uses the framework of https://github.com/jflam/chat-gpt-jupyter-extension to test Jupyterlab-specific Prompt Engineering ideas.

# 0 Prepare some Pandas DataFrames for testing later

## Create 2 Pandas DataFrames

```python
import pandas as pd

df_to_be_deleted = pd.DataFrame({
    'Name': ['John', 'Mary', 'Tom'],
    'Age': [25, 30, 40],
    'Is_Employed': [True, False, True],
    'Salary': [50000, 70000, 90000]
})

df_always = pd.DataFrame({
    'Date': ['2022-01-01', '2022-02-01', '2022-03-01'],
    'Time': ['10:00:00', '12:30:00', '15:00:00'],
    'Event': ['Meeting', 'Lunch', 'Presentation'],
    'Gender': ['M', 'F', 'M'],
    'Age': [25, 30, 40],
    'Salary': [50000, 70000, 90000],
    'Education': ['Bachelor', 'Master', 'PhD']
})

# convert 'Date' column to datetime type
df_always['Date'] = pd.to_datetime(df_always['Date'])

# convert 'Time' column to timedelta type
df_always['Time'] = pd.to_timedelta(df_always['Time'])

# combine 'Date' and 'Time' columns into a single datetime column
df_always['Datetime'] = df_always['Date'] + df_always['Time']

# drop 'Date' and 'Time' columns
df_always.drop(['Date', 'Time'], axis=1, inplace=True)


```

## Delete 1 Pandas DataFrames


```python
del df_to_be_deleted
```

# 1. "@chat" -- A general chat

## A language translation


```python
@chat 
Please transalte the following statement to English:
    人工智能可以大大提高工作效率。
```

##### response generated in thread   by ChatGPT in 2 seconds at 3/20/2023 8:52:43 PM

Artificial intelligence can greatly improve work efficiency.

## A Python code question

@chat
The following Python code has been developed:
```Python
import pandas as pd

df_test=pd.read_csv("df_test.csv", columns={"a","b","c"}, dtype={"a" : "int32","b" : "object","c" : "float64"})
```
Please append some Pythonic Python code to solve the following task. Please don't recreate the dataframes.
Please calculate the average of each column of #df_test

##### response generated  by ChatGPT in 3 seconds at 3/20/2023 8:52:57 PM



One way to calculate the average of each column in `df_test` is to use the `mean()` method on the dataframe:

```Python
column_means = df_test.mean()
print(column_means)
```

This will output a pandas series object with the mean value for each column.

# 2. "@2E" -- Translate every language to English

A sepecific command for translation


```python
@2E    OpenAI 是一家人工智能研究和部署公司，我们的使命是确保人工通用智能造福全人类。
```

##### response generated in thread     OpenAI 是一家人工智能研究和部署公司，我们的使命是确保人工通用智能造福全人类。 by ChatGPT in 1 seconds at 3/20/2023 8:53:07 PM

OpenAI is an artificial intelligence research and deployment company, with a mission to ensure that the benefits of general artificial intelligence are enjoyed by all of humanity.

# 3. "@2C" Translate every language to Chinese

A sepecific command for translation

@2C 
OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.

##### response generated in thread   by ChatGPT in 62 seconds at 3/20/2023 8:54:17 PM

OpenAI是一家人工智能研究和应用公司。我们的使命是确保人工通用智能造福于全人类。

# 4. "@Python" Ask for a code favour

A sepecific command for coding

## some Python code to build DataFrames context

**This will be migrated to Javascript to make the process fluent.**


```python
def get_df_defines():
  lines=["import pandas as pd", ""]

  dfs_only = {k: v for k, v in globals().items() if isinstance(v, pd.DataFrame)}

  for df_name, df in dfs_only.items():
    cols=','.join(['"'+c+'"' for c in df.columns])
    dts=','.join(['"'+c+'" : "'+str(t)+'"' for c, t in zip(df.columns,df.dtypes)])
    lines.append(df_name+'=pd.read_csv("'+df_name+'.csv", columns={'+cols+'}, dtype={'+ dts + '})')
  return '\n'.join(lines)
get_df_defines()
```




    'import pandas as pd\n\ndf_always=pd.read_csv("df_always.csv", columns={"Event","Gender","Age","Salary","Education","Datetime"}, dtype={"Event" : "object","Gender" : "object","Age" : "int64","Salary" : "int64","Education" : "object","Datetime" : "datetime64[ns]"})'



## To check df_to_be_deleted, which has been deleted


```python
@Python Please describe df_to_be_deleted
```

##### response generated in thread  Please describe df_to_be_deleted by ChatGPT in 12 seconds at 3/20/2023 8:54:51 PM

Unfortunately, there is no mention of `df_to_be_deleted` in the given code. Please provide more information about it so that I can help you with your task.

## To check df_always in the same prompt pattern


```python
@Python Please describe df_always
```

##### response generated in thread  Please describe df_always by ChatGPT in 10 seconds at 3/20/2023 8:55:27 PM

The given code reads a CSV file named "df_always.csv" and stores it in a pandas dataframe called `df_always`. The dataframe has columns named "Event", "Gender", "Age", "Salary", "Education" and "Datetime". The data types of these columns are specified using the `dtype` parameter. 

To solve the task, we need to merge two dataframes - `df_always` and another dataframe called `df_sometimes`. We can use the pandas function `merge()` for this purpose. Here's an example code snippet that demonstrates how to do this:

```Python
# read df_sometimes from csv
df_sometimes = pd.read_csv("df_sometimes.csv")

# merge df_always with df_sometimes on 'ID' column
merged_df = pd.merge(df_always, df_sometimes, on='ID')

# print merged dataframe
print(merged_df)
```

In this example, we first read the second CSV file containing another dataframe called `df_sometimes`. Then we used the pandas function `merge()` to combine both dataframes based on their common column `'ID'`. Finally, we printed out the resulting merged dataframe.

Note: Please replace `'ID'` with your desired common column name between two dataframes.

## To suggest a chart with the knowledge of df_always


```python
@Python Please suggest a chart for df_always
```

##### response generated in thread  Please suggest a chart for df_always by ChatGPT in 8 seconds at 3/20/2023 8:56:37 PM

To suggest a chart for `df_always`, we need to first understand the data and what insights we want to derive from it. Assuming that we want to visualize the distribution of salaries across different age groups, we can use a boxplot.

Here's the Pythonic code to generate a boxplot using `matplotlib` library:

```Python
import matplotlib.pyplot as plt

# Grouping salary by age
salary_by_age = df_always.groupby('Age')['Salary'].apply(list)

# Creating a list of salaries for each age group
salaries = [salary_by_age[i] for i in range(len(salary_by_age))]

# Plotting the boxplot
plt.boxplot(salaries)

# Adding labels and title
plt.xlabel('Age')
plt.ylabel('Salary')
plt.title('Distribution of Salaries Across Age Groups')

# Displaying the plot
plt.show()
```

This will generate a boxplot showing how salaries are distributed across different age groups.

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
