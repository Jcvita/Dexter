"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Codex = void 0;
const vscode = require("vscode");
class Codex {
    constructor(apiKey) {
        this.context = '';
        this.query = '';
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
        this.query = query;
    }
    clearQuery() {
        this.query = "";
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
        this.stopSequences = sequence.split("/|").filter(function (val, index) {
            return index < 4;
        });
    }
    clearStopSequences() {
        this.stopSequences = [];
    }
    async complete(appendResultAndQueryToContext) {
        if (!this.context || !this.query) {
            vscode.window.showErrorMessage("Codex: No Query Provided");
            return '';
        }
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.key}`
        };
        const data = {
            "prompt": this.context + '\n\n' + this.query,
            "max_tokens": this.resLength,
            "temperature": this.temp,
            "top_p": this.topp,
            "n": this.bestOf,
            "stream": false,
            "logprobs": null,
            "stop": this.stopSequences
        };
        await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data)
        })
            .then((response) => {
            if (response.status === 200) {
                return response.json().then((body) => {
                    const result = body.choices[0].text;
                    if (appendResultAndQueryToContext) {
                        this.addContext(result);
                        this.clearQuery();
                    }
                    return result;
                }).catch();
            }
            ;
        }).catch(err => {
            vscode.window.showErrorMessage(err.message);
            return '';
        });
        return '';
    }
}
exports.Codex = Codex;
//# sourceMappingURL=codex.js.map