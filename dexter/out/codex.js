"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Codex = void 0;
class Codex {
    constructor(apiKey) {
        this.context = '';
        this.queries = [];
        this.resLength = 64;
        this.temp = 0;
        this.topp = 1;
        this.freqPenalty = 0;
        this.presPenalty = 0;
        this.bestOf = 1;
        this.injectStart = '';
        this.injectRestart = '';
        this.engine = 'davinci-codex';
        this.key = apiKey;
    }
    addContext(context) {
        this.context = this.context + '\n' + context;
    }
    setEngine(engine) {
        this.engine = engine;
    }
    clearContext() {
        this.context = '';
    }
    getContext() {
        return this.context || "";
    }
    addQuery(query) {
        this.queries?.push(query);
    }
    clearQueries() {
        this.queries = [];
    }
    setBestOf(bestOf) {
        this.bestOf = bestOf;
    }
    setResLength(length) {
        if (length >= 4096) {
            this.resLength = 4096;
        }
        else if (length <= 1) {
            this.resLength = 1;
        }
        else {
            this.resLength = length;
        }
    }
    setTemp(temp) {
        if (temp >= 1) {
            this.temp = 1;
        }
        else if (temp <= 0) {
            this.temp = 0;
        }
        else {
            this.temp = temp;
        }
    }
    setTopp(topp) {
        if (topp >= 1) {
            this.topp = 1;
        }
        else if (topp <= 0) {
            this.topp = 0;
        }
        else {
            this.topp = topp;
        }
    }
    setFreqPenalty(freqPenalty) {
        if (freqPenalty >= 1) {
            this.freqPenalty = 1;
        }
        else if (freqPenalty <= 0) {
            this.freqPenalty = 0;
        }
        else {
            this.freqPenalty = freqPenalty;
        }
    }
    setPresPenalty(presPenalty) {
        if (presPenalty >= 1) {
            this.presPenalty = 1;
        }
        else if (presPenalty <= 0) {
            this.presPenalty = 0;
        }
        else {
            this.presPenalty = presPenalty;
        }
    }
    setStopSequences(sequence) {
        if (sequence.length === 0) {
            this.stopSequences = [];
            return;
        }
        this.stopSequences = sequence.split("/|").filter(function (val, index) {
            return index < 4;
        });
    }
    clearStopSequences() {
        this.stopSequences = [];
    }
    getStopSequences() {
        return this.stopSequences;
    }
    async complete() {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.key}`
        };
        var requests = [];
        this.queries?.forEach(async (query) => {
            const data = {
                "prompt": this.context + '\n\n' + query,
                "max_tokens": this.resLength,
                "temperature": this.temp,
                "top_p": this.topp,
                "n": this.bestOf,
                "stream": false,
                "logprobs": null,
                "stop": this.stopSequences
            };
            requests.push(fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data)
            }));
        });
        var strings = [];
        await Promise.all(requests).then((values) => {
            values.forEach(async (value) => {
                if (value.status === 200) {
                    await value.json().then((body) => {
                        strings.push(body.choices[0].text);
                    }).catch();
                }
                else if (value.status === 401) {
                    strings.push('UNAUTHORIZED');
                }
                else {
                    strings.push('ERROR');
                    await value.json().then((body) => {
                        strings.push(`${value.status} - ${body.error.message}`);
                    }).catch();
                }
            });
        });
        this.clearQueries();
        return strings;
    }
}
exports.Codex = Codex;
//# sourceMappingURL=codex.js.map