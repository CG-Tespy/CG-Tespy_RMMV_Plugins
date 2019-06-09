/*:

@plugindesc Minion barrier that vars you set certain enemies to function as minions to other 
enemies. Can be used for some interesting damage effects.

@author CG-Tespy https://github.com/CG-Tespy

@param Protection Receivers
@type struct<ProtectionReceiver>[]
@desc 

@param Protectors
@type struct<Protector>[]
@desc While on the field, these grant some sort of protection to the Receivers who have these assigned to them.
 
@help For RMMV versions 1.5.1 and above. See the help docs (not yet made) for help 
with using this plugin. 

Make sure to credit me if you're using this plugin in your game 
(include the name and webpage link in the Author section).

*/


/*~struct~ProtectionReceiver:

@param Name
@type string
@desc Name for this Receiver entry.
@default NewProtectionReceiver

@param Enemy DB Entry
@type enemy
@desc Best make sure no two Receivers have the same Enemy DB Entry; it may cause issues.
@default 0

@param Protectors
@type struct<Protector>[]
@desc What Protectors can protect this receiver. Best copy-paste them from the Protector list in the Plugin Manager.

@param Damage Mitigation
@type number 
@decimals 16
@min -1000000000
@desc Percent of damage this avoids while protected. See docs for more details.
@default 100

@param Transfers Damage
@type boolean
@desc Whether or not this Receiver transfers damage blocked by Damage Mitigation to its Protectors.
@default true


@param Damage Transferrable
@type number
@decimals 16
@min -1000000000
@desc Percentage of how much damage blocked by Damage Mitigation is transferred to its Protectors.
@default 100

@param Protectors Needed
@type number
@desc How many protectors this Receiver needs alive to get the protection.
@default 1

*/


/*~struct~Protector:

@param Name
@type string
@desc Name for this giver entry.
@default NewProtector
 
@param Enemy DB Entry
@type enemy
@desc Enemy this corresponds to.
@desc Best make sure no two Protectors have the same Enemy DB Entry; it may cause issues.
@default 0

@param Transfer Damage Mitigation
@type number
@decimals 16
@min -1000000000
@desc In percentages, how much damage transferred to this from a Receiver is mitigated. See the docs for more details.
@default 0

*/

// Make sure the namespaces are set up. And that this plugin's API is 
// accessible by other scripts.


//var CGT =                                   window.CGT || {};

window.CGT =                                window.CGT || CGT;
let thing =                                 new CGT.EnemBarr.BattleReceiver();

(function() {
    "use strict";
    
    /**
     * Why this isn't built into JS, I'll never know.
     */
    Array.prototype.remove =                function(toRemove)
    {
        let index =                         this.indexOf(toRemove);

        if (index >= 0)
            this.splice(index, 1);
    };
    
    /**
     * Namespace for CG-Tespy's Enemy Barrier plugin.
     * @namespace
     * @memberof CGT
     */
    CGT.EnemBarr = 
    {
        // Uses object-pooling to manage the custom enemy instances of this plugin, to reduce 
        // this plugin's overhead.
        enemyManager:
        {
            _protectorPool:                         [],
            _receiverPool:                          [],
            _battlerPool:                           [], // Contains both the protectors and receivers
            
            // These get populated whenever a battle starts.
            activeProtectors =                      [],
            activeReceivers =                       [],
            activeBattlers =                        [],

            onBattleStart: function()
            {
                CGT.EnemBarr._funcsToAlias.startBattle.call(this);
                this._registerBattlers();
            },

            onBattleEnd: function()
            {
                CGT.EnemBarr._funcsToAlias.endBattle.call(this);
                this._clearActiveBattlers();
                this._deactivateBattlers();
            },

            _registerBattlers:                      function()
            {
                // TODO: Use Object-pooling to greatly improve performance
                let enemiesInBattle =               $gameTroop.members();
                let currentEnemy =                  null;
                let database =                      CGT.EnemBarr.Database.S;
                let protectorClass =                CGT.EnemBarr.BattleProtector;
                let receiverClass =                 CGT.EnemBarr.BattleReceiver;

                // Going through all the enemies in battle...
                for (let i = 0; i < $enemiesInBattle.length; i++)
                {
                    let troop =                     enemiesInBattle[i];
                    let rmDbEnemy =                 troop.enemy();

                    // See if any of the EB database entries match the troop, based on their 
                    // RM database entries

                    // If so, see if there is a battler in the pool to fit the troop


                    // If there is, set that battler's properties based on the troop and 

                    // If there isn't create a new one. Again, will need to get the appropriate
                    // Database Entry. 

                    // Register that battler in the appropriate list(s).

                }

            },

            _clearActiveBattlers:                    function()
            {
                this.activeProtectors =                 [];
                this.activeReceivers =                  [];
                this.activeBattlers =                   [];
            },

            _deactivateBattlers:                     function()
            {
                for (let i = 0; i < this._battlerPool.length; i++)
                {
                    let battler =                       this.battlers[i];
                    battler.deactivate();
                }
            },

            // Helpers
            /**
             * Checks the EB Database for an entry that has the same RM DB entry
             * as the passed Game_Enemy. Returns the appropriate Battler entry type if a 
             * match is found, null otherwise.
             * @param {Game_Enemy} enemy 
             */
            _isEnemyInEbDb: function(enemy)
            {

            },

            /**
             * Looks through the pool, and returns true if it contains a battler with 
             * a gameEnemy sharing an ID with the passed one. False otherwise.
             * @param {Game_Enemy} enemy 
             */
            _isEnemyInPool: function(enemy)
            {

            },

            /**
             * Looks through the pool, and returns a battler that has a gameEnemy with 
             * the same ID as the passed enemy.
             * @param {Game_Enemy} enemy 
             */
            _retrieveBattlerFromPool: function(enemy)
            {

            },

        },

        activeProtectors: function()            { return this.enemyManager.activeProtectors; },
        activeReceivers: function()             { return this.enemyManager.activeReceivers; },
        activeBattlers: function()              { return this.enemyManager.activeBattlers; },

        // These contain the old logic before this plugin overrides it.
        _funcsToAlias:
        {
            titleScreenStart:                   Scene_Title.prototype.start,
            executeDamage:                      Game_Action.prototype.executeDamage,
            startBattle:                        BattleManager.startBattle,
            endBattle:                          BattleManager.endBattle
        },
        
        // These apply the plugin's functionality.
        _funcAliases: 
        {
            titleScreenStart:  function()
            {
                CGT.EnemBarr._funcsToAlias.titleScreenStart.call(this);

                // The database relies on variables that aren't set up properly before
                // any plugins are loaded. Hence waiting for the title screen to start 
                // before initializing it.
                CGT.EnemBarr.Database.S =           new CGT.EnemBarr.Database();
            },

            /**
             * @function
             * @param {Game_Battler} target 
             * @param {Number} damage 
             */
            executeDamage: function(target, damage)
            {
                // Check if the target is represented by one of this plugin's active 
                // Battler instances.
                let activeBattler =                 CGT.EnemBarr._helpers.getActiveEnemyBattler(target);

                if (activeBattler != null) // If so, let the battler handle taking damage.
                {
                    activeBattler.takeDamage(damage);
                    return;
                }
                else // Otherwise, let the old logic take over.
                {
                    let oldExecuteDamage =          CGT.EnemBarr._funcsToAlias.executeDamage;
                    oldExecuteDamage.call(damageAction, target, damage);
                }
                
            },

            startBattle:      function()
            {
                CGT.EnemBarr.enemyManager.onBattleStart()
            },

            endBattle:        function()
            {
                CGT.EnemBarr.enemyManager.onBattleEnd();
            }
        },

        _helpers:
        {
            /**
             * Returns the active Enemy Barrier Battler instance representing the passed Game_Enemy battler. 
             * If none exists, returns null instead.
             * @param {Game_Enemy} battlerToCheck
             */
            getActiveEnemyBattler(battlerToCheck)
            {
                // The battler needs to be in the current troop.
                if ($gameTroop.members().includes(battlerToCheck))
                {
                    let activeBattlers =            CGT.EnemBarr.activeBattlers();
                    let currentBattler =            null;

                    // Check for representation.
                    for (let i = 0; i < activeBattlers.length; i++)
                    {
                        currentBattler =            activeBattlers[i];

                        if (currentBattler.gameEnemy === battlerToCheck) // We found a rep!
                            return currentBattler;
                    }

                }

                return null;
            }
        },

        // Utils for other scripts (or even this one) to use.
        utils:
        {
            /**
             * Activates the Enemy Barrier Battler functionality, for the troop being represented
             * by the passed battler.
             * @param {CGT.EnemBarr.Battler} battler 
             */
            activateBattler: function(battler)
            {
                battler.activate();

                // Add the battler to the appropriate lists
                let activeBattlers =            CGT.EnemBarr.enemyManager.activeBattlers;
                let activeProtectors =          CGT.EnemBarr.activeProtectors();
                let activeReceivers =           CGT.EnemBarr.activeReceivers;

                if (!activeBattlers.includes(battler))
                    activeBattlers.push(battler);

                let isProtector =               battler instanceof CGT.EnemBarr.BattleProtector;
                let isReceiver =                battler instanceof CGT.EnemBarr.BattleReceiver;
                
                if (isProtector && !activeProtectors.includes(battler))
                    activeProtectors.push(battler);
                else if (isReceiver && !activeReceivers.includes(battler))
                    activeReceivers.push(battler);

            },

            /**
             * Deactivates the Enemy Barrier Battler functionality, for the troop being represented
             * by the passed battler.
             * @param {CGT.EnemBarr.Battler} battler 
             */
            deactivateBattler: function(battler)
            {
                battler.deactivate();

                let activeBattlers =            CGT.EnemBarr.enemyManager.activeBattlers;
                let activeProtectors =          CGT.EnemBarr.activeProtectors();
                let activeReceivers =           CGT.EnemBarr.activeReceivers;

                // Remove the battler from the appropriate lists. No need for any fancy
                // checking; if Array.remove doesn't even find the element to remove, 
                // nothing happens.
                activeBattlers.remove(battler);
                activeProtectors.remove(battler);
                activeReceivers.remove(battler);
                
            },

            /**
             * @param {CGT.EnemBarr.Battler} battler 
             */
            deactivateBattlerByBattleId(battleId)
            {
                // TODO: Deactivate an active battler based on the battle ID
            }

        },

        // Basically the main function for this plugin.
        _run: function()
        {
            setupClasses();
            applyFuncAliases();
        }

    };

    function setupClasses()
    {
        CGT.EnemBarr.DatabaseEnemy =        class 
        {
            // Backing fields.
            _name =                    "";
            _rmEnemDbId =               ""; // ID of the enemy in the RM Database
            _rmEnemDbEntry =            ""; // The entry of the enemy in the RM Database
            _rawEntry =                 undefined; 
            // ^ Enemy Barrier Database Entry from the Plugin Manager, parsed as a JS object.
            
            // Getters
            get name()                  { return this._name; }
            get rmEnemDbId()            { return this._rmEnemDbId; }
            get rmEnemDbEntry()         { return this._rmEnemDbEntry; }
            get rawEntry()              { return this._rawEntry; }

            // Methods
            constructor(rawEntry)
            {
                this._rawEntry =                    rawEntry;
                this._name =                        rawEntry['Name'];
                this._rmEnemDbId =                  Number(rawEntry['Enemy DB Entry']);
                // The "Enemy DB Entry" field, despite how it was set for the Plugin Manager, 
                // only gives you the ID in actuality. So...
                this._rmEnemDbEntry =               $dataEnemies[this.rmEnemDbId];
            }

            equals(otherDbEnemy)
            {
                return this.name === otherDbEnemy.name && 
                this.rmEnemDbId === otherDbEnemy.rmEnemDbId &&
                this.rmEnemDbEntry === otherDbEnemy.rmEnemDbEntry;
            }


        };

        /** 
        * For the Database Protectors.
        */
        CGT.EnemBarr.DatabaseProtector =    class extends CGT.EnemBarr.DatabaseEnemy
        {
            
            // Backing fields.
            _transDamMit =              0;

            // Getters
            get transDamMit()           { return this._transDamMit; }

            // Methods
            constructor(rawEntry)
            {
                super(rawEntry);
                this._transDamMit =                 Number(rawEntry['Transfer Damage Mitigation']);
            }

            equals(otherProtector)
            {
                if (super.equals(otherProtector))
                    return this.transDamMit === otherProtector.transDamMit;
                
                else
                    return false;
            }

            static isProtector(gameEnemy)
            {
                // Go through all the DatabaseProtectors in the database, and see if the passed troop 
                // shares an ID with any of the entries.
                let rmDbEntry =                 gameEnemy.enemy();
                let protectorList =             CGT.EnemBarr.Database.S.protectors;

                for (let i = 0; i < protectorList.length; i++)
                {
                    let protector =             protectorList[i];
                    if (protector.rmEnemDbId == rmDbEntry.id)
                        return true;
                }

                return false;

            }
        };

        CGT.EnemBarr.DatabaseReceiver =     class extends CGT.EnemBarr.DatabaseEnemy
        {
            // Backing fields.
            _rawProtectors =            []; // From the PluginManager, parsed into JS objects.
            _protectors =               []; // Database Protectors.
            _damageMiti =               100; // Damage Mitigation.
            _transDamage =              true; // Whether or not this transfers damage.
            _damageTrans =              100; // Percent of damage transferred
            _protNeeded =               1; // Protectors needed.

            // Getters
            get rawProtectors()         { return this._rawProtectors; }
            get protectors()            { return this._protectors; }
            get damageMiti()            { return this._damageMiti; }
            get transDamage()           { return this._transDamage; }
            get damageTrans()           { return this._damageTrans; }
            get protNeeded()            { return this._protNeeded; }

            // Setters
            set protectors(newArr)      { this._protectors = newArr; }

            // Methods
            constructor(rawEntry)
            {
                super(rawEntry);

                // Parse the protectors list into the raw protectors you use to instantiate 
                // Database Protectors.
                var rawsList =              JSON.parse(rawEntry['Protectors']);
                for (var i = 0; i < rawsList.length; i++)
                {
                    this._rawProtectors.push(JSON.parse(rawsList[i]))
                }

                // Set up the other fields, making sure they're the right types.
                this._damageMiti =          Number(rawEntry['Damage Mitigation']);
                this._transDamage =         Boolean(rawEntry['Transfers Damage']);
                this._damageTrans =         Number(rawEntry['Damage Transferrable']);
                this._protNeeded =          Number(rawEntry['Protectors Needed']);
            }

            static isReceiver(gameEnemy)
            {
                // Go through the all the DatabaseReceivers in the database, see if the passed troop 
                // shares an ID with any of the entries.
                let rmDbEntry =              gameEnemy.enemy();
                let receiverList =           CGT.EnemBarr.Database.S.receivers;

                for (let i = 0; i < receiverList.length; i++)
                {
                    let receiver =          receiverList[i];
                    if (receiver.rmEnemDbId == rmDbEntry.id)
                        return true;
                }

                return false;
            }
        };

        CGT.EnemBarr.Battler =              class
        {
            // Backing fields.
            _isActive =                     true;
            _gameEnemy =                    null; // The troop in the current battle this represents.
            _ebDbEnemy =                    null;  
            // EnemBarr Database Protector instance for this. To be set by subclasses.

            // Getters
            get gameEnemy()                 { return this._gameEnemy; }
            get ebDbEnemy()                 { return this._ebDbEnemy; }
            get isActive()                  { return this._isActive; }

            // Setters
            set gameEnemy(value)            { this._gameEnemy = value; }
            set isActive(value)             { this._isActive = value; }

            /**
             * 
             * @param {CGT.EnemBarr.DatabaseEnemy} databaseEntry
             * @param {Game_Enemy} gameEnemy 
             */
            constructor(databaseEntry, gameEnemy)
            {
                this.set(databaseEntry, gameEnemy);
            }

            // Sets this instance's properties based on the passed Enemy Barrier Database Entry 
            // and battle troop.
            set(databaseEntry, gameEnemy)
            {
                this.set(gameEnemy);
                this._ebDbEnemy =           databaseEntry;

                // Pull a Kirby and copy the fields/methods of the passed entry to this one.
                databaseEntry.constructor.call(this, databaseEntry.rawEntry);
            }

            activate()
            {
                this._isActive =            true;
            }

            deactivate()
            {
                this._isActive =            false;
            }

            takeDamage(damage) {} // Let subclasses override this.

        }

        CGT.EnemBarr.BattleProtector =      class extends CGT.EnemBarr.Battler
        {
            
            takeDamage(damage)
            {
                CGT.EnemBarr._funcsToAlias.executeDamage.call(damageAction, this.gameEnemy, damage);
            }

            shouldProtect(battleReceiver)
            {
                // Remember that the raw's Enemy DB Entry field is actually a number string.
                for (let i = 0; i < battleReceiver.rawProtectors.length; i++)
                {
                    // See if any of the receiver's raw protectors have an ID matching that of this
                    // one's raw entry.
                    let rawProtector =      battleReceiver.rawProtectors[i];
                    
                    if (rawProtector['Enemy DB Entry'] == this.rmEnemDbId)
                        return true;
                }

                return false;
            }

            // For when this Protector needs to take damage transferred to it by 
            // a Receiver.
            showWasDamaged()
            {
                this._gameEnemy.startDamagePopup();
                if (this._gameEnemy.isDead())
                    this._gameEnemy.performCollapse();
            }

        };

        CGT.EnemBarr.BattleReceiver =       class extends CGT.EnemBarr.Battler
        {
            // Backing fields.
            _battleProtectors =             [];

            // Getters
            get battleProtectors()          { return this._battleProtectors; }
            
            set(databaseEntry, gameEnemy)
            {
                this._battleProtectors =    []; // For when this instance is to be reused.
                super.set.call(this, databaseEntry, gameEnemy);
            }

            // Looks through the passed list of Battle Protectors, and registers the right ones 
            // to this receiver.
            registerBattleProtectors(toRegister)
            {
                for (let i = 0; i < toRegister.length; i++)
                {
                    let battProtector =     toRegister[i];
                    if (battProtector.isActive && battProtector.shouldProtect(this))
                        this._battleProtectors.push(battProtector);
                }
            }

            aliveProtectorCount()
            {
                let amount =                                        0;

                this.protectors.forEach(
                    function(protector)
                    {
                        // Protectors count as alive when they're not dead (duh) and when they've appeared in 
                        // the current battle.
                        let pGameEnemy =                             protector.gameEnemy;
                        if (pGameEnemy.isActive && pGameEnemy.isAppeared() && !pGameEnemy.isDead())
                            amount++;
                    }
                );

                return amount;
            }

            isProtected()
            {
                return this.isActive && this.aliveProtectorCount() > this.protNeeded;
            }

            takeDamage(rawDamage)
            {
                let damageThisTakes =                       rawDamage;
                
                if (this.isProtected())
                {
                    console.log(this.name + " is protected, with " + this._damageMiti + "% damage mitigation!");
                    // Apply the damage mitigation.
                    let damageMitigated =                   rawDamage * (this._damageMiti / 100.0);
                    console.log("Damage " + this.name + " mitigated: " + damageMitigated);
                    damageThisTakes -=                      damageMitigated;
                    damageThisTakes =                       Math.floor(damageThisTakes);
        
                    if (this.transDamage && damageThisTakes >= 0)
                        this._handleDamageTransferral(rawDamage);
                    
                }
                else 
                {
                    console.log(this.name + " is not protected!");
                }
        
                console.log("Damage taken by " + this.name + ": " + damageThisTakes);
                let oldExecuteDamage =                      CGT.EnemBarr._funcsToAlias.executeDamage;
                // TODO: Find a way to get the appropriate damage action so oldExecuteDamage works as it should
                oldExecuteDamage.call(damageAction, this.gameEnemy, damageThisTakes);
        
            }

            _handleDamageTransferral(damToTrans)
            {
                // Can't transfer damage if there's nothing to transfer to, so...
                let protectorsLeft =                            this.aliveProtectorCount();
                if (protectorsLeft <= 0)
                    return;

                // Set how much of the damage can be transferred
                damToTrans =                                    Math.floor(damToTrans * 
                                                                (this._damageTrans / 100));
                
                // Decide how the damage will be spread between the protectors. 
                let damageSpreadEvenly =                        Math.floor(damToTrans / protectorsLeft);

                let damageToApply =                             undefined; // Can be reduced by protectors' mitigations.
                let pGameEnemy =                                undefined;
                // ^Protector's Game_Enemy instance. Needed to apply the damage.

                this.protectors.forEach(
                    function(protector)
                    {
                        pGameEnemy =                            protector.gameEnemy;

                        // Only harm protectors that are still alive and in the battle.
                        if (!pGameEnemy.isActive || !pGameEnemy.isAppeared() || pGameEnemy.isDead())
                            return;

                        damageToApply =                         damageSpreadEvenly;

                        // The protectors can mitigate the damage transferred to them, so...
                        let mitigatedDamage =                   Math.floor(damageToApply * 
                                                                (protector._transDamMit / 100));
                        damageToApply -=                        mitigatedDamage;
                        
                        let oldExecuteDamage =                  CGT.EnemBarr._funcsToAlias.executeDamage;
                        // TODO: Find a way to get the current damage action so the execute damage func works
                        oldExecuteDamage.call(damageAction, pGameEnemy, damageToApply);

                        // Make sure the graphical effects pop up as they should.
                        protector.showWasDamaged();
                    }
                );
            }

        };

        CGT.EnemBarr.Database = class
        {
            // Backing fields.
            _protectors =                       [];
            _receivers =                        [];
            _enemies =                          []; // Both Protectors and Receivers.

            // Getters
            get protectors()                    { return this._protectors; }
            get receivers()                     { return this._receivers; }
            get enemies()                       { return this._enemies; }

            // Methods
            constructor()
            {
                this._parseDatabaseEntries();
            }

            _parseDatabaseEntries()
            {
                let pluginParams =              PluginManager.parameters("CGT_EnemyBarrier");
                let rawReceivers =              JSON.parse(pluginParams["Protection Receivers"]); 
                let rawProtectors =             JSON.parse(pluginParams["Protectors"]); 
                
                // Refine the Protectors and Receivers set up in the PluginManager to  
                // DatabaseProtectors and DatabaseReceivers. Makes having those entities work 
                // in battle easier to manage in code.
                for (let i = 0; i < rawProtectors.length; i++)
                {
                    let rawProtector =          JSON.parse(rawProtectors[i]);
                    // ^ Turning it from a string to an actual JS object
                    let parsedProtector =       new CGT.EnemBarr.DatabaseProtector(rawProtector);
                    
                    this._protectors.push(parsedProtector);
                    this._enemies.push(parsedProtector);
                }

                // Same as for the Protectors.
                for (let i = 0; i < rawReceivers.length; i++)
                {
                    let rawReceiver =           JSON.parse(rawReceivers[i]);
                    let parsedReceiver =        new CGT.EnemBarr.DatabaseReceiver(rawReceiver);
                    this._receivers.push(parsedReceiver);
                    this._enemies.push(parsedReceiver);
                }
            }

            /**
             * @param {int} id 
             * @param {*} entryType Class for the entry type
             */
            // Returns an entry with a matching ID (if one is in this Database). Returns null otherwise. 
            getEntryById(id, entryType = undefined)
            {
                let listToSearch =          this._getListForEntryType(entryType);

                // Search through the entries as appropriate.
                if (listToSearch != null)
                {
                    for (let i = 0; i < listToSearch.length; i++)
                    {
                        let entry =         listToSearch[i];
                        if (entry.rmEnemDbId === id)
                            return entry;
                    }
                }

                return null;
            }

            /**
             * Returns an entry in the database that has the passed RM Database Enemy registered 
             * within it. If no entry exists, null is returned.
             * @param {RPG.Enemy} enemy
             * @param {*} entryType Class for the entry type.
             */
            getEntryByEnemy(enemy, entryType = undefined)
            {
                let listToSearch =                  this._getListForEntryType(entryType);
                
                if (listToSearch == null)
                {
                    for (let i = 0; i < listToSearch.length; i++)
                    {
                        let entry =                 listToSearch[i];
                        if (entry.rmEnemDbId == enemy.id)
                            return entry;
                    }
                }

                return null;
            }

            containsEntryWithId(id, entryType = undefined)
            {
                let listToSearch =          this._getListForEntryType(entryType);

                if (listToSearch != null)
                {
                    for (let i = 0; i < listToSearch.length; i++)
                    {
                        let entry = listToSearch[i];
                        if (entry.rmEnemDbId === id)
                            return true;
                    }
                }
                
                return false;
            }

            _getListForEntryType(entryType)
            {
                if (entryType === CGT.EnemBarr.DatabaseProtector)
                    return this.protectors;
                    
                else if (entryType === CGT.EnemBarr.DatabaseReceiver)
                    return this.receivers;
                
                else if (entryType === CGT.EnemBarr.DatabaseEnemy || entryType === undefined)
                    return this.enemies;

                return null;
            }

        };
    }

    function applyFuncAliases()
    {
        Scene_Title.prototype.start =                   CGT.EnemBarr._funcAliases.titleScreenStart;
        BattleManager.startBattle =                     CGT.EnemBarr._funcAliases.startBattle;
        Game_Action.prototype.executeDamage =           CGT.EnemBarr._funcAliases.executeDamage;
        BattleManager.endBattle =                       CGT.EnemBarr._funcAliases.endBattle;
    }
    
    CGT.EnemBarr._run();

})();
