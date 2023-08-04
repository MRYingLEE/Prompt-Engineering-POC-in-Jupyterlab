import ExpiryMap from "expiry-map";
import { v4 as uuidv4 } from "uuid";
import { fetchSSE } from "./fetch-sse.mjs";

// const KEY_ACCESS_TOKEN = "accessToken";

const cache = new ExpiryMap(10 * 1000);

// async function getAccessToken() {
//   if (cache.get(KEY_ACCESS_TOKEN)) {
//     return cache.get(KEY_ACCESS_TOKEN);
//   }
//   const resp = await fetch("https://chat.openai.com/api/auth/session")
//     .then((r) => r.json())
//     .catch(() => ({}));
//   if (!resp.accessToken) {
//     throw new Error("UNAUTHORIZED");
//   }
//   cache.set(KEY_ACCESS_TOKEN, resp.accessToken);
//   return resp.accessToken;
// }

async function getAnswer(totalPrompt, callback) {
  // const accessToken = await getAccessToken();


  const apiKey = "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";//await utils.getApiKey()
  const headers = {
    'Content-Type': 'application/json',
  }
  headers['Authorization'] = `Bearer ${apiKey}`;

  const apiURL = 'https://api.openai.com'
  const apiURLPath = '/v1/chat/completions'

  const apipath = `${apiURL}${apiURLPath}`;
  console.log("APIPath:", apipath);

  const body = {
    model: 'gpt-3.5-turbo',
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
    stream: true,
  }

  console.log("messages", totalPrompt);
  messages = JSON.parse(totalPrompt)
  console.log("System Prompt:", messages.systemPrompt);
  console.log("User Prompt:", messages.userPrompt);;

  if (messages.systemPrompt != "") {
    body["messages"] = [
      { role: 'system', content: messages.systemPrompt },
      { role: 'user', content: messages.userPrompt },
    ]
  } else {
    body["messages"] = [
      { role: 'user', content: messages.userPrompt },
    ]
  }

  console.log(body);
  console.log(JSON.stringify(body));

  await fetchSSE(apipath, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    //   onMessage(message) {
    //   console.debug("sse message", message);
    //   if (message === "[DONE]") {
    //     console.log("COMPLETED receiving response from ChatGPT");
    //     return;
    //   }
    //   const data = JSON.parse(message);
    //   const text = data.message?.content?.parts?.[0];
    //   if (text) {
    //     callback(text);
    //   }
    // },

    onMessage: (msg) => {
      let resp
      try {
        console.log(msg);

        resp = JSON.parse(msg);
        console.log(resp);
        // eslint-disable-next-line no-empty
      } catch {
        // query.onFinish('stop')
        console.log("stop");
        return
      }
      const { choices } = resp
      if (!choices || choices.length === 0) {
        return { error: 'No result' }
      }
      const { finish_reason: finishReason } = choices[0]
      if (finishReason) {

        console.log("COMPLETED receiving response from ChatGPT");
        // query.onFinish(finishReason)
        return
      }

      let targetTxt = ''

      const { content = '', role } = choices[0].delta
      targetTxt = content

      // if (trimFirstQuotation && isFirst && targetTxt && ['“', '"', '「'].indexOf(targetTxt[0]) >= 0) {
      //   targetTxt = targetTxt.slice(1)
      // }

      // if (!role) {
      //   isFirst = false
      // }

      // query.onMessage({ content: targetTxt, role })

      if (targetTxt) {
        callback(targetTxt)
      }

    }
  });
}

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (messages) => {
    // console.log("received msg", msg);
    try {
      const complete_answer = await getAnswer(messages, (answer) => {
        port.postMessage({ answer });
      });
      port.postMessage({ end: "END" });
    } catch (err) {
      console.log("ERROR: ", err);
      port.postMessage({ error: err.message });
      // cache.delete(KEY_ACCESS_TOKEN);
    }
  });
});
