export class Codex {
    key: string;
    context?: string = '';
    queries?: string[] = [];
    resLength?: number = 64;
    temp?: number = 0;
    topp?: number = 1;
    freqPenalty?: number = 0;
    presPenalty?: number = 0;
    bestOf?: number = 1;
    stopSequences?: string[];
    injectStart?: string = '';
    injectRestart?: string = '';
    engine?: string = 'davinci-codex';
    
    constructor(apiKey: string) {
        this.key = apiKey;
    }

    addContext(context: string) {
        this.context = this.context + '\n' + context;
    }

    setEngine(engine: string) {
        this.engine = engine;
    }

    clearContext() {
        this.context = '';
    }

    getContext() {
        return this.context || "";
    }

    addQuery(query: string) {
        this.queries?.push(query) ;
    }

    clearQueries() {
        this.queries = [];
    }

    setBestOf(bestOf: number) {
        this.bestOf = bestOf;
    }

    setResLength(length: number) {
        if (length >= 4096) {
            this.resLength = 4096;
        } else if (length <= 1) {
            this.resLength = 1;
        } else {
            this.resLength = length;
        }
    }

    setTemp(temp: number) {
        if (temp >= 1) {
            this.temp = 1;
        } else if (temp <= 0) {
            this.temp = 0;
        } else {
            this.temp = temp;
        }
    }

    setTopp(topp: number) {
        if (topp >= 1) {
            this.topp = 1;
        } else if (topp <= 0) {
            this.topp = 0;
        } else {
            this.topp = topp;
        }
    }
    
    setFreqPenalty(freqPenalty: number) {
        if (freqPenalty >= 1) {
            this.freqPenalty = 1;
        } else if (freqPenalty <= 0) {
            this.freqPenalty = 0;
        } else {
            this.freqPenalty = freqPenalty;
        }
    }
    
    setPresPenalty(presPenalty: number) {
        if (presPenalty >= 1) {
            this.presPenalty = 1;
        } else if (presPenalty <= 0) {
            this.presPenalty = 0;
        } else {
            this.presPenalty = presPenalty;
        }
    }

    setStopSequences(sequence: string){
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
        return this.stopSequences || [];
    }

    getResLength() {
        return this.resLength;
    }

    getTemp() {
        return this.temp;
    }

    getTopp() {
        return this.topp;
    }

    getFreqPenalty() {
        return this.freqPenalty;
    }

    getPresPenalty() {
        return this.presPenalty;
    }

    getBestOf() {
        return this.bestOf;
    }


    async complete() {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.key}`
        };

        var requests: Promise<Response>[] = [];

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

        var strings: string[] = [];

        await Promise.all(requests).then((values) => {
            values.forEach(async (value) => {
                if (value.status === 200) {
                    await value.json().then((body) => {
                        strings.push(body.choices[0].text);
                    }).catch();
                } else if (value.status === 401) {
                    strings.push('UNAUTHORIZED');
                } else {
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