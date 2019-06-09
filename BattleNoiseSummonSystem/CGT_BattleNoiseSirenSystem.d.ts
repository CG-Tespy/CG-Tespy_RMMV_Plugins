declare namespace CGT
{
    
    declare namespace BNSS
    {
        let pluginCommands: {
            addNoise(args: string[]),
            reduceNoise(args: string[]),
            setNoise(args: string[]),
            setNoiseTroopEnabled(args: string[]),
            setAllNoiseTroopsEnabled(args: string[]),
            forceTriggerSummonSequence(args: string[]),
            dict: CGT.Dictionary
        };

        let database:
        {
            weapons: NoiseWeapon[],
            troops: NoiseTroop[],

        };

        class BaseNoiseWeapon
        {
            get id(): string;
            get weaponEntry(): RPG.Weapon;
            get noise(): number;
            get pitch(): number;
            get pan(): number;
            get soundClip(): Sound; 
        }

        class BaseNoiseTroop
        {
            get id(): string;
            get isEnabled(): boolean;
            get troopEntry(): RPG.Troop;
            get startNoise(): number;
            get sirenThresh(): number;
            get sirenSound(): Sound;
            get summonPool(): RPG.Troop[];
            get summonLimit(): number;

        }

        class NoiseWeapon extends BaseNoiseWeapon
        {
            static get AnyMadeNoise(): CGT.Event;
            get MadeNoise(): CGT.Event;

            get noiseTriggers(): RPG.Skill[];

            constructor(raw: BaseNoiseWeapon);

            public makeNoise();
        }

        class NoiseTroop extends BaseNoiseTroop
        {
            static get AnySirenSounded(): CGT.Event;
            static get current(): NoiseTroop;
            get SirenSounded(): CGT.Event;
            /** How many enemies this summoned for this troop the current battle. */
            get summonCount(): number;
            get summonManager(): SummonManager;
            get totalNoise(): number;
            get sirenThresh(): number;

            constructor(raw: BaseNoiseTroop);
            triggerSummonSequence(force: Boolean);
            soundTheSiren(force: Boolean);
            summonEnemies(force: Boolean);
            clearState();
        }

        class SummonManager
        {
            /** Summon Entries available to use for summoning. */
            get available(): SummonEntry[];
            /** Summon Entries unavailable to use for summoning. */
            get unavailable(): SummonEntry[];

            get isEnabled(): Boolean;
            /** How many enemies this manager summoned in the current battle. */
            get summonCount(): number;

            constructor(summonPool : string[]);

            /**
             * Tries summoning an enemy to the current battle. Returns the 
             * Game_Enemy is successful. Null otherwise.
             */
            summonEnemy(force: Boolean) : Game_Enemy;

            /**
             * Resets the parts of this manager's state that change in battle. 
             */
            clearState();

        }

        class SummonEntry
        {
            get troop(): RPG.Troop;
            get troopMember(): RPG.Troop.Member;
            get memberId(): number;
            get gameEnemy(): Game_Enemy;
            get xPos(): number;
            get yPos(): number;

            get summonAvailable(): boolean;

            constructor(troop: RPG.Troop, member: RPG.Troop.Member);
        }

        class NoiseMakingArgs // For passing to events related to noise weapons making noise
        {
            private _noiseWeapon: NoiseWeapon;

            get noiseWeapon() : NoiseWeapon;
            get soundClip(): CGT.Sound;
            get noise(): number;
            get pitch(): number;
            get pan(): number;
        }
    }
}