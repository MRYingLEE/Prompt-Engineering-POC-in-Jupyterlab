(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/p-defer/index.js
  var require_p_defer = __commonJS({
    "node_modules/p-defer/index.js"(exports, module) {
      "use strict";
      module.exports = () => {
        const ret = {};
        ret.promise = new Promise((resolve, reject) => {
          ret.resolve = resolve;
          ret.reject = reject;
        });
        return ret;
      };
    }
  });

  // node_modules/map-age-cleaner/dist/index.js
  var require_dist = __commonJS({
    "node_modules/map-age-cleaner/dist/index.js"(exports, module) {
      "use strict";
      var pDefer = require_p_defer();
      function mapAgeCleaner(map, property = "maxAge") {
        let processingKey;
        let processingTimer;
        let processingDeferred;
        const cleanup = async () => {
          if (processingKey !== void 0) {
            return;
          }
          const setupTimer = async (item) => {
            processingDeferred = pDefer();
            const delay = item[1][property] - Date.now();
            if (delay <= 0) {
              map.delete(item[0]);
              processingDeferred.resolve();
              return;
            }
            processingKey = item[0];
            processingTimer = setTimeout(() => {
              map.delete(item[0]);
              if (processingDeferred) {
                processingDeferred.resolve();
              }
            }, delay);
            if (typeof processingTimer.unref === "function") {
              processingTimer.unref();
            }
            return processingDeferred.promise;
          };
          try {
            for (const entry of map) {
              await setupTimer(entry);
            }
          } catch (_a) {
          }
          processingKey = void 0;
        };
        const reset = () => {
          processingKey = void 0;
          if (processingTimer !== void 0) {
            clearTimeout(processingTimer);
            processingTimer = void 0;
          }
          if (processingDeferred !== void 0) {
            processingDeferred.reject(void 0);
            processingDeferred = void 0;
          }
        };
        const originalSet = map.set.bind(map);
        map.set = (key, value) => {
          if (map.has(key)) {
            map.delete(key);
          }
          const result = originalSet(key, value);
          if (processingKey && processingKey === key) {
            reset();
          }
          cleanup();
          return result;
        };
        cleanup();
        return map;
      }
      module.exports = mapAgeCleaner;
    }
  });

  // node_modules/expiry-map/dist/index.js
  var require_dist2 = __commonJS({
    "node_modules/expiry-map/dist/index.js"(exports, module) {
      "use strict";
      var mapAgeCleaner = require_dist();
      var ExpiryMap2 = class {
        constructor(maxAge, data) {
          this.maxAge = maxAge;
          this[Symbol.toStringTag] = "Map";
          this.data = /* @__PURE__ */ new Map();
          mapAgeCleaner(this.data);
          if (data) {
            for (const [key, value] of data) {
              this.set(key, value);
            }
          }
        }
        get size() {
          return this.data.size;
        }
        clear() {
          this.data.clear();
        }
        delete(key) {
          return this.data.delete(key);
        }
        has(key) {
          return this.data.has(key);
        }
        get(key) {
          const value = this.data.get(key);
          if (value) {
            return value.data;
          }
          return;
        }
        set(key, value) {
          this.data.set(key, {
            maxAge: Date.now() + this.maxAge,
            data: value
          });
          return this;
        }
        values() {
          return this.createIterator((item) => item[1].data);
        }
        keys() {
          return this.data.keys();
        }
        entries() {
          return this.createIterator((item) => [item[0], item[1].data]);
        }
        forEach(callbackfn, thisArg) {
          for (const [key, value] of this.entries()) {
            callbackfn.apply(thisArg, [value, key, this]);
          }
        }
        [Symbol.iterator]() {
          return this.entries();
        }
        *createIterator(projection) {
          for (const item of this.data.entries()) {
            yield projection(item);
          }
        }
      };
      module.exports = ExpiryMap2;
    }
  });

  // src/background/index.mjs
  var import_expiry_map = __toESM(require_dist2(), 1);

  // node_modules/eventsource-parser/dist/index.mjs
  function createParser(onParse) {
    let isFirstChunk;
    let buffer;
    let startingPosition;
    let startingFieldLength;
    let eventId;
    let eventName;
    let data;
    reset();
    return {
      feed,
      reset
    };
    function reset() {
      isFirstChunk = true;
      buffer = "";
      startingPosition = 0;
      startingFieldLength = -1;
      eventId = void 0;
      eventName = void 0;
      data = "";
    }
    function feed(chunk) {
      buffer = buffer ? buffer + chunk : chunk;
      if (isFirstChunk && hasBom(buffer)) {
        buffer = buffer.slice(BOM.length);
      }
      isFirstChunk = false;
      const length = buffer.length;
      let position = 0;
      let discardTrailingNewline = false;
      while (position < length) {
        if (discardTrailingNewline) {
          if (buffer[position] === "\n") {
            ++position;
          }
          discardTrailingNewline = false;
        }
        let lineLength = -1;
        let fieldLength = startingFieldLength;
        let character;
        for (let index = startingPosition; lineLength < 0 && index < length; ++index) {
          character = buffer[index];
          if (character === ":" && fieldLength < 0) {
            fieldLength = index - position;
          } else if (character === "\r") {
            discardTrailingNewline = true;
            lineLength = index - position;
          } else if (character === "\n") {
            lineLength = index - position;
          }
        }
        if (lineLength < 0) {
          startingPosition = length - position;
          startingFieldLength = fieldLength;
          break;
        } else {
          startingPosition = 0;
          startingFieldLength = -1;
        }
        parseEventStreamLine(buffer, position, fieldLength, lineLength);
        position += lineLength + 1;
      }
      if (position === length) {
        buffer = "";
      } else if (position > 0) {
        buffer = buffer.slice(position);
      }
    }
    function parseEventStreamLine(lineBuffer, index, fieldLength, lineLength) {
      if (lineLength === 0) {
        if (data.length > 0) {
          onParse({
            type: "event",
            id: eventId,
            event: eventName || void 0,
            data: data.slice(0, -1)
          });
          data = "";
          eventId = void 0;
        }
        eventName = void 0;
        return;
      }
      const noValue = fieldLength < 0;
      const field = lineBuffer.slice(index, index + (noValue ? lineLength : fieldLength));
      let step = 0;
      if (noValue) {
        step = lineLength;
      } else if (lineBuffer[index + fieldLength + 1] === " ") {
        step = fieldLength + 2;
      } else {
        step = fieldLength + 1;
      }
      const position = index + step;
      const valueLength = lineLength - step;
      const value = lineBuffer.slice(position, position + valueLength).toString();
      if (field === "data") {
        data += value ? "".concat(value, "\n") : "\n";
      } else if (field === "event") {
        eventName = value;
      } else if (field === "id" && !value.includes("\0")) {
        eventId = value;
      } else if (field === "retry") {
        const retry = parseInt(value, 10);
        if (!Number.isNaN(retry)) {
          onParse({
            type: "reconnect-interval",
            value: retry
          });
        }
      }
    }
  }
  var BOM = [239, 187, 191];
  function hasBom(buffer) {
    return BOM.every((charCode, index) => buffer.charCodeAt(index) === charCode);
  }

  // src/background/stream-async-iterable.mjs
  async function* streamAsyncIterable(stream) {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          return;
        }
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }

  // src/background/fetch-sse.mjs
  async function fetchSSE(resource, options) {
    const { onMessage, ...fetchOptions } = options;
    const resp = await fetch(resource, fetchOptions);
    const parser = createParser((event) => {
      if (event.type === "event") {
        onMessage(event.data);
      }
    });
    for await (const chunk of streamAsyncIterable(resp.body)) {
      const str = new TextDecoder().decode(chunk);
      parser.feed(str);
    }
  }

  // src/background/index.mjs
  var cache = new import_expiry_map.default(10 * 1e3);
  async function getAnswer(msg, callback) {
    const apiKey = "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";
    const headers = {
      "Content-Type": "application/json"
    };
    headers["Authorization"] = `Bearer ${apiKey}`;
    const apiURL = "https://api.openai.com";
    const apiURLPath = "/v1/chat/completions";
    const apipath = `${apiURL}${apiURLPath}`;
    console.log("APIPath:", apipath);
    const body = {
      model: "gpt-3.5-turbo",
      temperature: 0,
      max_tokens: 1e3,
      top_p: 1,
      frequency_penalty: 1,
      presence_penalty: 1,
      stream: true
    };
    console.log("messages", msg);
    messages=JSON.parse(messages);
    console.log("System Prompt:", messages.systemPrompt);
    console.log("User Prompt:", messages.userPrompt);
    ;
    body["messages"] = [
      { role: "system", content: messages.systemPrompt },
      { role: "user", content: messages.userPrompt }
    ];
    console.log(body);
    await fetchSSE(apipath, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      onMessage: (msg) => {
        let resp;
        try {
          resp = JSON.parse(msg);
        } catch {
          console.log("stop");
          return;
        }
        const { choices } = resp;
        if (!choices || choices.length === 0) {
          return { error: "No result" };
        }
        const { finish_reason: finishReason } = choices[0];
        if (finishReason) {
          console.log("COMPLETED receiving response from ChatGPT");
          return;
        }
        let targetTxt = "";
        const { content = "", role } = choices[0].delta;
        targetTxt = content;
        if (targetTxt) {
          callback(targetTxt);
        }
      }
    });
  }
  chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (messages) => {
      try {
        const complete_answer = await getAnswer(messages, (answer) => {
          port.postMessage({ answer });
        });
        port.postMessage({ end: "END" });
      } catch (err) {
        console.log("ERROR: ", err);
        port.postMessage({ error: err.message });
      }
    });
  });
})();
