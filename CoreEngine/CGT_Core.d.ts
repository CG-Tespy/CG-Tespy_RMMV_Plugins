declare namespace CGT
{
    /**
     * To respond to certain events after they've happened (or are in the process of happening).
     * The timing of these callbacks firing off is not guaranteed, though they'll usually fire off 
     * at least after the original versions of their corresponding funcs have been called.
     */
    declare namespace Callbacks
    {
        let TitleScreenStart: CGT.Event;
        let BattleStart: CGT.Event;
        let BattleEnd: CGT.Event;
        let DamageExecute: CGT.Event;
        let EnemyDeath: CGT.Event;

    }

    declare enum SoundType
    {
        bgm = "bgm",
        bgs = "bgs",
        me = "me",
        se = "se"
    }

    declare class Sound
    {
        // Credit to whoever wrote the original class in the RMMV Script Call List

        // Limiters
        static minVolume: number;
        static maxVolume: number;
        static minPitch: number;
        static maxPitch: number;
        static minPan: number;
        static maxPan: number;

        // Getters
        get name(): string;
        get volume(): number;
        get pitch(): number;
        get pan(): number;

        // Methods
        public play();

        constructor(fileName: string, soundType: any, volume: number, pitch: number, pan: number);

    }

    declare class Dictionary
    {
        get keys(): any[];

        public add(key: any, value: any);
        public remove(key: any): boolean;
        public get(key: any): any;
        public getAtIndex(index: number) : any;
        public hasKey(key: any): boolean;
        public length() : number;
        public clear();
    }

    declare class Event
    {
        private _callbacks: CGT.Dictionary;
        private _argCount: number;

        constructor(argCount: number);

        get argCount() : number;

        public addListener(func: function, caller: Object);
        public removeListener(func: function, caller: Object);
        public invoke(args : any[]);
    }
    
}
