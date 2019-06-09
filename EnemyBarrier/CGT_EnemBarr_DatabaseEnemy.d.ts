declare namespace CGT
{
    namespace EnemBarr
    {
        class DatabaseEnemy
        {
            private _name: string;
            private _rmEnemDbId: number;
            private _rmEnemDbEntry: Game_Enemy;
            private _rawEntry: Object;
        
            get name():string { return this._name; }
            get emEnemDbID():number { return this._rmEnemDbId; }
            get rmEnemDbEntry():Game_Enemy { return this._rmEnemDbEntry; }
            get rawEntry():object { return this._rawEntry; }

            constructor(rawEntry: object);
        }

        class DatabaseProtector extends DatabaseEnemy
        {
            private _transDamMit: number;

            get transDamMit():number { return this._transDamMit; }

            public equals(otherProtector: DatabaseProtector): boolean;
            public static isProtector(gameEnemy: Game_Enemy): boolean;

        }

        class DatabaseReceiver extends DatabaseEnemy
        {
            private _rawProtectors: object[]; 
            private _protectors: DatabaseProtector[];
            private _damageMiti: number;
            private _transDamage: Boolean;
            private _damageTrans: number;
            private _protNeeded: number;

            // Getters
            get rawProtectors():object[]            { return this._rawProtectors; }
            get protectors():DatabaseProtector[]    { return this._protectors; }
            get damageMiti():number                 { return this._damageMiti; }
            get transDamage():Boolean               { return this._transDamage; }
            get damageTrans():number                { return this._damageTrans; }
            get protNeeded():number                 { return this._protNeeded; }

        }

        class Battler
        {
            private _isActive: Boolean;
            private _troop: Game_Enemy;
            private _ebDbEnemy: DatabaseEnemy;

            // Getters
            get isActive(): Boolean { return this._isActive; }
            get troop(): Game_Enemy { return this._troop; }
            get ebDbEnemy(): DatabaseEnemy { return this._ebDbEnemy; }
            
            constructor(databaseEntry: DatabaseEnemy, troop: Game_Enemy);

            public set(databaseEntry: DatabaseEnemy, troop: Game_Enemy);

            public activate();
            public deactivate();
            public takeDamage(damage: number);

        }

        class BattleProtector extends Battler
        {
            public shouldProtect(battleReceiver: BattleReceiver);
            public showWasDamaged();
        }

        class BattleReceiver extends Battler
        {
            
            private _battleProtectors: BattleProtector[];

            get battleProtectors(): BattleProtector[]   { return this._battleProtectors; }

            // Methods
            public registerBattleProtectors(toRegister: BattleProtector[]);
            public aliveProtectorCount(): number;
            public isProtected() : boolean;

            private _handleDamageTransferral(damToTrans: number);
            
        }

        class Database
        {
            private _protectors: DatabaseProtector[];
            private _receivers: DatabaseReceiver[];
            private _enemies: DatabaseEnemy[];

            // Methods
            private _parseDatabaseEntries();

            public getEntryById(id: number, entryType: object): DatabaseEnemy;
            public containsEntryWithId(id: number, entryType: object): boolean;

            private _getListForEntryType(entryType: object): DatabaseEnemy[];

        }
    }
}

