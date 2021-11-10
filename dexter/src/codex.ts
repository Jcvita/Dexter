import axios, {AxiosError, AxiosResponse} from "axios";

export class Codex {
    key: string = '';
    context: string = '';
    queries: string[] = [];
    resLength: number = 64;
    temp: number = 0;
    topp: number = 1;
    freqPenalty: number = 0;
    presPenalty: number = 0;
    bestOf: number = 1;
    stopSequences?: string[];
    injectStart: string = '';
    injectRestart: string = '';
    engine: string = 'davinci-codex';
    
    constructor() {

    }

    insertAPIKey(apiKey: string){
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
        this.queries.push(query) ;
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

    getAPIKey() {
        return this.key;
    }

    async complete() {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.key}`
        };

        var requests: Promise<AxiosResponse>[] = [];
        
        this.queries.forEach(async (query) => {
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

            requests.push(axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data)
            }).catch())
        })
            
        console.log(requests)

        var strings: string[] = [];

        await Promise.all(requests).then((values) => {
            values.forEach(async (res) => {
                if (res.status === 200) {
                    strings.push(res.data.choices[0].text)
                } else if (res.status === 401) {
                    strings.push('401 UNAUTHORIZED - Bad Key?');
                } else {
                    // strings.push('ERROR');
                    strings.push(`${res.status} - ${res.data.error.message}`);
                }
            });
        
        }).then(undefined, console.error);
        this.clearQueries();
        return strings;   
    }
}