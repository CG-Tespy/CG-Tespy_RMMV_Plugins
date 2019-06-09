/*:

@plugindesc Lets you set enemies to be summoned as noise is made.

@author CG-Tespy https://github.com/CG-Tespy

@help This is version 1.0 of this plugin. For RMMV versions 1.5.1 and above. 
Requires CGT_CoreEngine. See the help docs on the github page for information 
on using this plugin.

Make sure to credit me if you're using this plugin in your game
(include the name and webpage link that's in the Author section).

@param Noise Troops
@type struct<NoiseTroop>[]
@default []
@desc These decide details of how the BNSS affects your game's Troops.

@param Noise Weapons
@type struct<NoiseWeapon>[]
@default []
@desc These decide details related to how your game's weapons take part in the BNSS.

*/


/*~struct~NoiseWeapon:

@param ID
@type string
@desc Used to uniquely identify this weapon, for use in Plugin Commands.

@param Weapon Entry
@type weapon
@default 0
@desc The entry in the Weapon Database this represents.

@param Noise Triggers
@type skill[]
@default []
@desc The skills that can trigger this weapon to make noise.

@param Noise
@type number
@min -1000000
@default 10
@desc How much this adds to a Troop's Total Noise.

@param Pitch
@type number
@min -100
@max 100
@default 0

@param Pan
@type number
@min -100
@max 100
@default 0

@param Sound Clip
@type file
@dir audio/se
@desc The sound this weapon plays every time it's used.

*/

/*~struct~NoiseTroop:

@param ID
@type string
@desc Used to uniquely identify this troop, for use in Plugin Commands.

@param Is Enabled
@type boolean
@default true
@desc Whether or not this the BNSS applies to this troop.

@param Troop Entry
@type troop
@default 0
@desc The entry in the Troop Database this represents.

@param Siren Threshold
@type number
@default 100
@desc How far the Total Noise value has to go to summon any enemies.

@param Starting Total Noise
@type number
@default 0
@desc How noisy it starts off being in battle with this troop.

@param Siren Sound
@type file
@dir audio/se
@desc Sound effect that plays when the siren goes off, summoning enemies.

@param Summon Pool
@type troop[]
@default []
@desc Troops containing the enemies that can be summoned in battle to this one.

@param Summon Limit
@type number
@min 0
@default 3
@desc How many enemies can be summoned each battle with this troop.

*/

CGT.BNSS =                              {};
CGT.BNSS.verNum =                       0.07;

// Make sure the HimeWorks Enemy Reinforcements plugin is enabled
if (TH == undefined || TH.EnemyReinforcements == undefined)
{
    var message = "CGT BattleNoiseSirenSystem requires HIME EnemyReinforcements to function.";
    alert(message);
    throw message;
}

// Set up the ES5 classes and this plugin's Plugin Commands
(function() {
    "use strict";

    /** Json-parsed NoiseWeapon with the fields set to the actual right values. */
    CGT.BNSS.BaseNoiseWeapon =          class
    {
        // Getters
        /** @returns {number} */
        get id()                        { return this._id; }
        /** @returns {RPG.Weapon} */
        get weaponEntry()               { return this._weaponEntry; }
        /** @returns {number} */
        get noise()                     { return this._noise; }
        /** @returns {RPG.Skill[]} */
        get noiseTriggers()             { return this._noiseTriggers; }
        /** @returns {number} */
        get pitch()                     { return this._pitch; }
        /** @returns {number} */
        get pan()                       { return this._pan; }
        /** @returns {CGT.Sound} */
        get soundClip()                 { return this._soundClip; }
        get parsedJson()                { return this._parsedJson; }

        // Methods
        constructor(parsedJson)
        {
            this._noiseTriggers =       [];

            this._parsedJson =          parsedJson;
            this._id =                  String(parsedJson['ID']);
            // Despite setting an Entry in the MV editor, in code, you just get an index.
            // So we have to use that index to get to the actual weapon object.
            let weaponIndex =           Number(parsedJson['Weapon Entry']); 
            if (weaponIndex > 0)
                this._weaponEntry =     $dataWeapons[weaponIndex];
            
            // Similar case for the noise triggers. It's just an array of indexes.
            let skillIndexes =          parsedJson['Noise Triggers'];
            for (let i = 0; i < skillIndexes.length; i++)
            {
                let skill =             $dataSkills[skillIndexes[i]];
                this.noiseTriggers.push(skill);
            }

            this._noise =               Number(parsedJson['Noise']);
            this._pitch =               Number(parsedJson['Pitch']);
            this._pan =                 Number(parsedJson['Pan']);

            // Set up the sound clip
            let clipFileName =          parsedJson['Sound Clip'];

            if (clipFileName != "")
            {
                let volume =            AudioManager.seVolume;
                this._soundClip =       new CGT.Sound(clipFileName, CGT.SoundType.se, volume, this._pitch, this._pan);
            }
        }
    };

    /** Json-parsed NoiseTroop with the fields set to the actual right values. */
    CGT.BNSS.BaseNoiseTroop =           class
    {
        // Getters
        /** @returns {number} */
        get id()                        { return this._id; }
        /** @returns {bool} */
        get isEnabled()                 { return this._isEnabled; }
        /** @returns {RPG.Troop} */
        get troopEntry()                { return this._troopEntry; }
        /** @returns {number} */
        get startNoise()                { return this._startNoise; }
        /** @returns {number} */
        get sirenThresh()               { return this._sirenThresh; }
        /** @returns {CGT.Sound} */
        get sirenSound()                { return this._sirenSound; }
        /** @returns {RPG.Troop[]} */
        get summonPool()                { return this._summonPool; }
        /** @returns {number} */
        get summonLimit()               { return this._summonLimit; }
        /** @returns {number} */
        get totalNoise()                { return this._totalNoise; }

        // Methods
        constructor(parsedJson)
        {
            this._setFromJson(parsedJson);
        }

        _setFromJson(parsedJson)
        {
            this._parsedJson =          parsedJson;
            this._id =                  parsedJson['ID'];
            this._isEnabled =           Boolean(parsedJson['Is Enabled']);
            
            this._setTroopEntries(parsedJson);
            this._setNoiseParams(parsedJson);
            this._setSummonParams(parsedJson);
            this._setSoundClip(parsedJson);
        }

        _setTroopEntries(parsedJson)
        {
            // Make sure that if the troop entry is set to something, that we get a reference
            // to the actual entry under the hood
            let troopEntryIndex =       Number(parsedJson['Troop Entry']);
            if (troopEntryIndex > 0)
            {
                this._troopEntry =      $dataTroops[troopEntryIndex];
            }
        }

        _setNoiseParams(parsedJson)
        {
            this._startNoise =          Number(parsedJson['Starting Total Noise']);
            this._totalNoise =          this._startNoise;
            this._sirenThresh =         Number(parsedJson['Siren Threshold']);
        }

        _setSummonParams(parsedJson)
        {
            // Make sure that if the Summon Pool is set to have any Troops, that we get references
            // to (again) the actual troops entries under the hood
            this._summonPool =          parsedJson['Summon Pool'].slice(0);
            for (let i = 0; i < this._summonPool.length; i++)
            {
                let summonIndex =       this._summonPool[i];
                this._summonPool[i] =   $dataTroops[summonIndex];
            }

            this._summonLimit =         Number(parsedJson['Summon Limit']);
        }

        _setSoundClip(parsedJson)
        {
            let soundName =             parsedJson['Siren Sound'];
            if (soundName != "")
                this._sirenSound =      new CGT.Sound(soundName, CGT.SoundType.se, AudioManager.seVolume, 0, 0);
        }
    };

    /** Contains the main functionality for NoiseWeapons to work in the BNSS. */
    CGT.BNSS.NoiseWeapon =              class extends CGT.BNSS.BaseNoiseWeapon
    {
        // Events set up just below this class declaration

        /** Takes 1 arg. Sends a CGT.BNSS.NoiseMakingArgs upon invoking.
         * @returns {CGT.Event} 
         * */
        static get AnyMadeNoise()       { return CGT.BNSS.NoiseWeapon._AnyMadeNoise; }
        /** Takes 1 arg. Sends a CGT.BNSS.NoiseMakingArgs upon invoking.
         * @returns {CGT.Event} 
         * */
        get MadeNoise()                 { return this._MadeNoise; }

        // Methods
        /**
         * Takes a BaseNoiseWeapon as a parameter instead of a parsed json.
         * @param {CGT.BNSS.BaseNoiseWeapon} baseWeapon 
         */
        constructor(baseWeapon)
        {
            super(baseWeapon.parsedJson);
            this._MadeNoise =           new CGT.Event(1);
            this._noiseArgs =           new CGT.BNSS.NoiseMakingArgs(this);
        }

        makeNoise()
        {
            if (this.soundClip != undefined) // Only play a sound if this has one assigned
            {
                // Update the volume before playing
                this.soundClip.volume =     AudioManager.seVolume;
                this.soundClip.play();
            }

            // Let anything that cares know that this made some noise.
            CGT.BNSS.NoiseWeapon.AnyMadeNoise.invoke(this._noiseArgs);
            this.MadeNoise.invoke(this._noiseArgs);
        }

    };

    // Static field(s)
    CGT.BNSS.NoiseWeapon._AnyMadeNoise =            new CGT.Event(1);

    /** Contains the main functionality for NoiseTroops to work in the BNSS. */
    CGT.BNSS.NoiseTroop =                           class extends CGT.BNSS.BaseNoiseTroop
    {
        // Events set up below this class declaration
        
        // Getters (several have had to be redeclared from the base class. Inheritance glitch in MV 1.5.1.)
        /** Troop active in the current battle. 
         * @returns {CGT.BNSS.NoiseTroop} */
        static get current()            { return CGT.BNSS.NoiseTroop._current; }
        static set current(value)       { CGT.BNSS.NoiseTroop._current = value; }
        /** Not yet fully implemented.
         * @returns {CGT.Event}
         */
        static get AnySirenSounded()    { return this._AnySirenSounded; }

        /** @returns {bool} */
        get isEnabled()                 { return this._isEnabled; }
        /** @returns {CGT.Event} */
        get SirenSounded()              { return this._SirenSounded; }
        get totalNoise()                { return this._totalNoise; }
        get sirenThresh()               { return this._sirenThresh; } // Had to be re-declared
        /** @returns {number} How many enemies were summoned in this troop in the current battle. */
        get summonCount()               { return this.summonManager.summonCount; }
        /** @returns {RPG.Troop[]} */
        get summonPool()                { return this._summonPool; }
        get summonManager()             { return this._summonManager; }

        // Setters
        set isEnabled(value)            
        { 
            // The Summon Manager should only be enabled when this is.
            this._isEnabled =               value; 
            this.summonManager.enabled =    value;
        }
        set totalNoise(value)           { this._totalNoise = value; }
        set sirenThresh(value)          { return this._sirenThresh = value; }
        set summonCount(value)          { this.summonManager.summonCount = value; }

        /**
         * Takes a raw troop to set up instead of a parsed json.
         * @param {CGT.BNSS.BaseNoiseTroop} rawTroop 
         */
        constructor(rawTroop)
        {
            super(rawTroop._parsedJson);
            this._SirenSounded =            new CGT.Event(1);
            this._summonManager =           new CGT.BNSS.SummonManager(this.summonPool);
            this.isEnabled =                false;
            CGT.BNSS.NoiseWeapon.AnyMadeNoise.addListener(this._onAnyNoiseMade, this);
        }

        /**
         * Executes whenever a NoiseWeapon... makes noise.
         *  @param {CGT.BNSS.NoiseMakingArgs} weaponArgs 
         * */
        _onAnyNoiseMade(weaponArgs)
        {
            // Only do something if this is enabled, the current troop, and still having summons left
            if (!this.isEnabled || 
                $gameTroop.troop().id != this.troopEntry.id || 
                this.summonCount >= this.summonLimit)
                return;

            this.totalNoise +=          weaponArgs.noise;
            console.log(weaponArgs.noise + " noise made! Current noise:\n" + this.totalNoise);

            if (this.totalNoise >= this.sirenThresh)
            {
                this.triggerSummonSequence();
            }
        }

        /**
         * Makes this NoiseTroop sound the siren and summon enemies.
         */
        triggerSummonSequence(force)
        {
            if (force != true && !this.isEnabled)
                return;

            this.soundTheSiren(force);
            this.summonEnemies(force);
            this._alertSirenListeners(force);
        }

        soundTheSiren(force)
        {
            if (force != true && !this.isEnabled)
                return;

            // Update the volume before playing
            console.log("Sounding the siren!");
            if (this.sirenSound == undefined)
                return;

            this.sirenSound.volume =    AudioManager.seVolume;
            
            this.sirenSound.play();
            this.totalNoise =           0;

            // TODO: Invoke the proper events
        }

        summonEnemies(force)
        {
            if (force != true && !this.isEnabled)
                return;

            console.log("Summoning enemy due to noise!");

            // Let the Summon Manager take it from here.
            let summonedEnemy =                     this._summonManager.summonEnemy();
            
            if (summonedEnemy != null)
                this._summonCount++;
        }

        clearState()
        {
            this.summonCount =                  0;
            this.isEnabled =                    false;
            this.summonManager.clearState();
        }

        _alertSirenListeners(force)
        {
            if (force != true && !this.isEnabled)
                return;

            // TODO: Pass SirenSoundingArgs to the events
            CGT.BNSS.NoiseTroop.AnySirenSounded.invoke(this);
            this.SirenSounded.invoke(this);
        }

    };

    // Static field(s)
    CGT.BNSS.NoiseTroop.current =                   null;
    CGT.BNSS.NoiseTroop._AnySirenSounded =          new CGT.Event(1);

    CGT.BNSS.SummonManager = class
    {
        // Getters

        get summonEntries()                         { return this._summonEntries; }
        /** @returns {CGT.BNSS.SummonEntry[]} */
        get available()                             { return this._available; }
        /** @returns {CGT.BNSS.SummonEntry[]} */
        get unavailable()                           { return this._unavailable; }
        get isEnabled()                             { return this._isEnabled; }
        get summonCount()                           { return this._summonCount; }

        // Setters
        set summonCount(value)                      { this._summonCount = value; }

        // Methods
        /**
         * @param {RPG.Troop[]} summonPool 
         */
        constructor(summonPool)
        {
            // Set up the summon entries from the summon pool as set in the Plugin Params
            this._isEnabled =                       true;
            this._summonEntries =                   [];
            this._available =                       [];
            this._unavailable =                     [];
            this._summonCount =                     0;

            for (let i = 0; i < summonPool.length; i++)
            {
                let troopEntry =                    summonPool[i];
                
                for (let j = 0; j < troopEntry.members.length; j++)
                {
                    let member =                    troopEntry.members[j];
                    let memberId =                  j + 1;
                    let summonEntry =               new CGT.BNSS.SummonEntry(troopEntry, member, memberId);
                    this.available.push(summonEntry);
                    this.summonEntries.push(summonEntry);
                }

            }

            CGT.Callbacks.EnemyDeath.addListener(this._onEnemyDeath, this);
        }

        /**
         * Tries to summon an enemy to battle. Returns the Game_Enemy instance if successful,
         * null otherwise. Also returns null if called when this is enabled and not forced.
         */
        summonEnemy(force)
        {
            if (force != true && !this.isEnabled)
                return;

            // Randomly pick among the available Summon Entries, if there are any.
            if (this.available.length == 0 || !this.isEnabled)
                return null;

            let index =                                 Number.rand(0, this.available.length, true);
            let summonEntry =                           this.available[index];

            // Set up and then execute the plugin command to get it summoned
            let pluginCommand =                         "add_enemy";
            let commandArgs =                           [summonEntry.memberId, "from", 
                                                        "troop", summonEntry.troop.id];
            
            Game_Interpreter.prototype.pluginCommand.call(this, pluginCommand, commandArgs);

            // Register the Game_Enemy under the summon entry before marking it as unavailable
            let enemyIndex =                            $gameTroop.members().length - 1;
            let gameEnemy =                             $gameTroop.members()[enemyIndex];

            summonEntry.gameEnemy =                     gameEnemy;
            summonEntry.summonAvailable =               false;
            this.available.remove(summonEntry);
            this.unavailable.push(summonEntry);

            this.summonCount++;
            return gameEnemy;
        }
        
        clearState()
        {
            // Reset the gameEnemy properties of the summon entries to avoid
            // a memory leak.
            for (let i = 0; i < this.summonEntries.length; i++)
            {
                let summonEntry =               this.summonEntries[i];
                summonEntry.gameEnemy =         null;
            }

            this._available =                   this.summonEntries.slice(0);
            this._unavailable =                 [];
            this.summonCount =                  0;

        }

        /** @param {Game_Enemy} gameEnemy */
        _onEnemyDeath(gameEnemy)
        {
            if (!this.isEnabled)
                return;

            // See if the enemy that died is one summoned by this manager
            for (let i = 0; i < this.unavailable.length; i++)
            {
                let summonEntry =                       this.unavailable[i];
                // If so, mark the appropriate summon entry as available.
                if (gameEnemy.troopId() == summonEntry.troop.id &&
                    gameEnemy.troopMemberId() == summonEntry.memberId)
                {
                    summonEntry.summonAvailable =       true;
                    this.unavailable.remove(summonEntry);
                    this.available.push(summonEntry);
                    return;
                }
            }
        }

    };

    CGT.BNSS.SummonEntry = class
    {
        // Getters
        /** @returns {RPG.Troop} */
        get troop()                                 { return this._troop; }
        /** @returns {RPG.Troop.Member} */
        get troopMember()                           { return this._troopMember; }
        get memberId()                          { return this._memberId; }
        /** @returns {Game_Enemy} */
        get gameEnemy()                             { return this._gameEnemy; }
        /** @returns {number} */
        get xPos()                                  { return this.troopMember.x; }
        /** @returns {number} */
        get yPos()                                  { return this.troopMember.x; }
        /** @returns {number} */
        get summonAvailable()                       { return this._summonAvailable; }

        // Setters
        set troop(value)                            { this._troop = value; }
        set troopMember(value)                      { this._troopMember = value; }
        set memberId(value)                     { this._memberId = value; }
        set gameEnemy(value)                        { this._gameEnemy = value; }
        set summonAvailable(value)                  { this._summonAvailable = value; }

        // Methods
        /**
         * @param {RPG.Troop} troop
         * @param {RPG.Troop.Member} member 
         */
        constructor(troop, member, memberId)
        {
            this.troop =                            troop;
            this.troopMember =                      member;
            this.memberId =                     memberId;
            this.summonAvailable =                  true;
        }
    };

    CGT.BNSS.NoiseMakingArgs =          class
    {
        /** Weapon that made the noise.
         * @returns {CGT.BNSS.NoiseWeapon} */
        get noiseWeapon()               { return this._noiseWeapon; }
        /** @returns {number} */
        get noise()                     { return this._noiseWeapon.noise; }
        /** @returns {number} */
        get pitch()                     { return this._noiseWeapon.pitch; }
        /** @returns {number} */
        get pan()                       { return this._noiseWeapon.pan; }

        constructor(noiseWeapon)
        {
            this._noiseWeapon =         noiseWeapon;
        }

    };

    CGT.BNSS.SirenSoundingArgs =        class
    {
        /** Troop that sounded the siren.
         * @returns {CGT.BNSS.NoiseTroop} 
         * */
        get noiseTroop()                { return this._noiseTroop; }
        /** @returns {Game_Enemy[]} */
        get enemiesSummoned()           { return this._enemiesSummoned; }

        constructor()
        {
            this._enemiesSummoned =     [];
        }

    };

    // TODO: The commands
    /** @type {CGT.Dictionary} */
    let commandDict = new                CGT.Dictionary();

    // Set up the command funcs in a temporary object...
    CGT.BNSS.pluginCommands = 
    {
        addNoise(args) 
        {
            let currentTroop =          CGT.BNSS.NoiseTroop.current;
            if (currentTroop == null)
                return;
            
            currentTroop.totalNoise += Number(args[0]);
            //if (currentTroop.totalNoise >= currentTroop.sirenThresh)
              //  currentTroop.triggerSummonSequence();
            
        },

        reduceNoise(args) 
        {
            let currentTroop =          CGT.BNSS.NoiseTroop.current;
            if (currentTroop == null)
                return;

            currentTroop.totalNoise -= Number(args[0]);
            
        },

        setNoise(args) 
        {
            let currentTroop =          CGT.BNSS.NoiseTroop.current;
            if (currentTroop == null)
                return;

            currentTroop.totalNoise =   Number(args[0]);

            if (currentTroop.totalNoise >= currentTroop.sirenThresh)
                currentTroop.triggerSummonSequence();
            
        },

        setNoiseTroopEnabled(args)
        {
            let idArg =                     args[0];
            let enabled =                   args[1].toLowerCase();

            // Go through all the troops in the database, change the enablement state of the one with 
            // the passed ID (if it exists)
            let database =                  CGT.BNSS.database;

            for (let i = 0; i < database.troops.length; i++)
            {
                let troop =                 database.troops[i];
                if (troop.id === idArg)
                {
                    troop.isEnabled =       enabled == 'true';
                    return;
                }
            }

        },

        setAllNoiseTroopsEnabled(args)
        {
            let enabled =                   Boolean(args[0]);
            let database =                  CGT.BNSS.database;

            for (let i = 0; i < database.troops.length; i++)
            {
                let troop =                 database.troops[i];
                troop.isEnabled =           enabled;
            }

        },

        forceNoiseSummon(args)
        {
            let currentTroop =              CGT.BNSS.NoiseTroop.current;
            if (currentTroop == null)
                return;

            currentTroop.triggerSummonSequence(true);
        }
    };

    // ... add its members to the dict...
    let pluginCommands =                    CGT.BNSS.pluginCommands;

    commandDict.add("addNoise", pluginCommands.addNoise);
    commandDict.add("reduceNoise", pluginCommands.reduceNoise);
    commandDict.add("setNoise", pluginCommands.setNoise);
    commandDict.add("setNoiseTroopEnabled", pluginCommands.setNoiseTroopEnabled);
    commandDict.add("setAllNoiseTroopsEnabled", pluginCommands.setAllNoiseTroopsEnabled);
    commandDict.add("forceNoiseSummon", pluginCommands.forceNoiseSummon);

    // .. and register the dict for ease of use!
    CGT.BNSS.pluginCommands.dict =               commandDict;


})();

// Set up the databases of troops and weapons
(function()
{
    "use strict";
    CGT.BNSS.database = 
    {
        /** @type {CGT.BNSS.BaseNoiseTroop} */
        _baseTroops:                            [],

        /** @type {CGT.BNSS.BaseNoiseWeapon[]} */
        _baseWeapons:                           [],
        /** @type {CGT.BNSS.BaseNoiseTroop[]} */

        _troops:                                [],
        _weapons:                               [],
        _pluginParams:                          null,

        // Getters
        /** @returns {CGT.BNSS.NoiseWeapon[]} */
        get weapons()                           { return this._weapons; },
        /** @returns {CGT.BNSS.NoiseTroop[]} */
        get troops()                            { return this._troops; },
        
        // Methods
        init: function()
        {
            this._pluginParams =                PluginManager.parameters("CGT_BattleNoiseSirenSystem");
            this.setupBaseTroops();
            this.setupBaseWeapons();
            this.setupMainTroops();
            this.setupMainWeapons();
        },

        setupBaseTroops: function()
        {
            if (this._pluginParams['Noise Troops'] == "")
                return;

            let classlessTroops =               JSON.parse(this._pluginParams['Noise Troops']);
            
            for (let i = 0; i < classlessTroops.length; i++)
            {
                let rawTroop =                  JSON.parse(classlessTroops[i]);
                rawTroop['Summon Pool'] =       JSON.parse(rawTroop['Summon Pool']);
                let baseTroop =                 new CGT.BNSS.BaseNoiseTroop(rawTroop);
                this._baseTroops.push(baseTroop);
            }
        },

        setupBaseWeapons: function()
        {
            if (this._pluginParams['Noise Weapons'] == "")
                return;

            let classlessWeapons =              JSON.parse(this._pluginParams['Noise Weapons']);
            
            for (let i = 0; i < classlessWeapons.length; i++)
            {
                let rawWeapon =                JSON.parse(classlessWeapons[i]);
                rawWeapon['Noise Triggers'] =  JSON.parse(rawWeapon['Noise Triggers']);
                // The json parser doesn't parse recursively
                let baseWeapon =                new CGT.BNSS.BaseNoiseWeapon(rawWeapon);
                this._baseWeapons.push(baseWeapon);
            }
        },

        setupMainTroops: function()
        {
            // Go through all the raw troops, and use them to create main ones.
            for (let i = 0; i < this._baseTroops.length; i++)
            {
                let baseTroop =                 this._baseTroops[i];
                let mainTroop =                 new CGT.BNSS.NoiseTroop(baseTroop);
                this.troops.push(mainTroop);
            }
        },

        setupMainWeapons: function()
        {
            for (let i = 0; i < this._baseWeapons.length; i++)
            {
                let baseWeapon =                this._baseWeapons[i];
                let mainWeapon =                new CGT.BNSS.NoiseWeapon(baseWeapon);
                this.weapons.push(mainWeapon);
            }
        },

    };

})();

// Set up and apply function aliases
(function()
{
    "use strict";

    let oldFuncs = 
    {
        actionApply:                    Game_Action.prototype.apply,
        pluginCommand:                  Game_Interpreter.prototype.pluginCommand,
    };

    let newFuncs = 
    {

        actionApply(target)
        {
            // If the action is a skill used by a party member, go through all the noise weapons.
            let skill =                         this.asSkill();
            let partyMember =                   this.subjectAsActor();

            if (skill != null && partyMember != null)
            {
                /** @type {CGT.BNSS.NoiseWeapon[]} */
                let weapons =                   CGT.BNSS.database.weapons;
                /** @type {RPG.EquipItem[]} */
                let memberEquips =              partyMember.equips();

                for (let i = 0; i < weapons.length; i++)
                {
                    // If the current weapon has the skill registered under it, and the party member 
                    // has that weapon equipped...
                    let weapon =                weapons[i];
                    let hasSkill =              weapon.noiseTriggers.includes(skill);
                    let weaponEquipped =        memberEquips.includes(weapon.weaponEntry);

                    if (hasSkill && weaponEquipped) // Make some noise!
                        weapon.makeNoise();
                }
            }

            oldFuncs.actionApply.call(this, target);
            
        },
        
        /**
         * @param {string} command 
         * @param {string[]} args 
         */
        pluginCommand(command, args)
        {
            oldFuncs.pluginCommand.call(this, command, args);
            
            // This plugin's commands are registered in a dict. Use it to call the right one.
            let commandDict =           CGT.BNSS.pluginCommands.dict;

            if (commandDict.hasKey(command))
            {
                let commandFunc =       commandDict.get(command);
                commandFunc.call(this, args);
                //return;
            }

            // TODO extra: Make the plugin commands case-insensitive
        },
    };

    
    function onBattleStart()
    {
        // See which NoiseTroop should be treated as the active one. Go through the database
        let database =                          CGT.BNSS.database;
        let noiseTroops =                       database.troops;
        let activeTroop =                       $gameTroop.troop();
        
        for (let i = 0; i < noiseTroops.length; i++)
        {
            let noiseTroop =                    noiseTroops[i];
            // If the current noise troop has the same ID as the one in battle now, then 
            // that's the one we want.
            if (activeTroop.id == noiseTroop.troopEntry.id)
            {
                CGT.BNSS.NoiseTroop.current =   noiseTroop;
                noiseTroop.isEnabled =          true;
                return;
            }
        }

    }

    function noiseTroopCleanup()
    {
        let currentTroop =                      CGT.BNSS.NoiseTroop.current;
        currentTroop.clearState();
        CGT.BNSS.NoiseTroop.current =           null;
    }
    
    function applyFuncAliases()
    {
        Game_Action.prototype.apply =               newFuncs.actionApply;
        Game_Interpreter.prototype.pluginCommand =  newFuncs.pluginCommand;
    }

    function hookupCallbacks()
    {
        let database =                              CGT.BNSS.database;
        CGT.Callbacks.TitleScreenStart.addListener(database.init, database);
        CGT.Callbacks.BattleStart.addListener(onBattleStart, this);
        CGT.Callbacks.BattleEnd.addListener(noiseTroopCleanup, this);
    }
    
    applyFuncAliases();
    hookupCallbacks();
})();
