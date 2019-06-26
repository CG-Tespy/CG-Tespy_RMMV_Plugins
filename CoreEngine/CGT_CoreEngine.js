/*:
 * @plugindesc Mainly contains utility code that other CGT scripts rely on.
 * @author CG-Tespy https://github.com/CG-Tespy
 * @help This is version 0.61 of this plugin. For RMMV versions 1.5.1 and above. See 
the help docs on the github page for information on using this plugin.
 */

"use strict";
let CGT =                                   {};
CGT.coreVerNum =                            0.61;

// Extensions to preexisting APIs
(function()
{
    
    /**
     * Add a callback function that will be called when the bitmap is loaded.
     * Author: MinusGix
     * @method addLoadListener
     * @param {Function} listener The callback function
     */
    Bitmap.prototype.addLoadListener = function(listener) {
        if (!this.isReady()) {
            this._loadListeners.push(listener);
        } else {
            listener(this);
        }
    };

    Bitmap.prototype.removeLoadListener = function(listener)
    {
        this._loadListeners.remove(listener);
    }

    Bitmap.prototype.hasLoadListener = function(listener)
    {
        return this._loadListeners.includes(listener);
    }


    /**
     * Returns a resized version of the bitmap (if it is ready). Note that 
     * the aspect ratio may not be the same, based on the passed width and height. 
     * @param {number} width
     * @param {number} height
     */
    Bitmap.prototype.resized = function(width, height)
    {
        if (!this.isReady())
            return;

        let newBitmap =                     new Bitmap(width, height);

        newBitmap.blt(this, 0, 0, this.width, this.height, 0, 0, width, height);
        return newBitmap;
    }

    PIXI.Sprite.prototype.resized =         function(width, height)
    {
        let newSprite =                     new PIXI.Sprite(this.texture);
        newSprite.width =                   width;
        newSprite.height =                  height;

        return newSprite;
    }

    PIXI.Sprite.prototype.copy =            function()
    {
        let newSprite =                     new PIXI.Sprite(this.texture);
        newSprite.width =                   this.width;
        newSprite.height =                  this.height;
        return newSprite;
    }

    PIXI.Sprite.prototype.resize = function(width, height)
    {
        this.width =                        width;
        this.height =                       height;
    }
    
    // Why this wasn't built into JS, I'll never know.
    Array.prototype.remove =                function(toRemove)
    {
        let index =                         this.indexOf(toRemove);

        if (index >= 0)
            this.splice(index, 1);
    };

    // MV version 1.5.1 doesn't support Array.includes out of the box
    Array.prototype.includes = function(element)
    {
        for (let i = 0; i < this.length; i++)
            if (this[i] === element)
                return true;

        return false;
    }    

    Number.clamp =                          function(val, min, max) 
    {
        if (val < min)
            return min;
        else if (val > max)
            return max;
        else
            return val;
    };

    /**
     * Returns a random number in the range passed.
     */
    Number.rand = function(from, to, wholeNumber)
    {
        let num =                               from;
        let difference =                        to - from;
        num +=                                  Math.random() * difference;
        
        if (wholeNumber === true)
            return Math.floor(num);
        else
            return num;
    }


    Game_Action.prototype._subjectAsType =  function(typeWanted)
    {
        let subject =                           this.subject();

        if (subject instanceof typeWanted)
            return subject;
        else
            return null;
    }

    /** 
     * Returns the action's item if it's a normal item. Null otherwise.
     * @returns {RPG.Item} */
    Game_Action.prototype.asItem =          function()
    {
        let item =                          $dataItems[this.item().id];
        if (item != undefined)
            return item;
        else
            return null;
    };

    /** 
     * Returns the action's item if it's a skill. Null otherwise.
     * @returns {RPG.Skill} */
    Game_Action.prototype.asSkill =         function()
    {
        let skill =                         $dataSkills[this.item().id];
        if (skill != undefined)
            return skill;
        else
            return null;
    }

    /**
     * Returns this action's subject if the subject is an actor. Null otherwise.
     * @returns {Game_Actor}
     */
    Game_Action.prototype.subjectAsActor =      function()
    {
        return this._subjectAsType(Game_Actor);
    }

    /**
     * Returns this action's subject if the subject is an enemy. Null otherwise.
     * @returns {Game_Enemy}
     */
    Game_Action.prototype.subjectAsEnemy =      function()
    {
        return this._subjectAsType(Game_Enemy);
    }

    
})();

// Other utils
(function()
{
    
    // Enum
    CGT.SoundType =                         Object.freeze({
        bgm: "bgm",
        bgs: "bgs",
        me: "me",
        se: "se",
        
        asArr: Object.freeze(["bgm", "bgs", "me", "se"]),
    });

    console.log("SoundType as arr: " + CGT.SoundType.asArr);

    /** Adapted from the Sound Object in the RMMV Script Call List from the RPGMaker.net Discord server. */
    CGT.Sound =                             class
    {
        // Getters
        get name()                          { return this._name; }
        get type()                          { return this._type; }
        get volume()                        { return this._volume; }
        get pitch()                         { return this._pitch; }
        get pan()                           { return this._pan; }
        get raw()                           { return this._raw; }

        // Setters
        set name(value) 
        { 
            this._name =                    value; 
            this._removeExtensionFromName();
        }

        set type(value) 
        { 
            // Make sure a valid SoundType is being passed
            if (CGT.SoundType.asArr.includes(value))
                this._type =                value;
            else
            {
                let message =               "Tried to set invalid sound type value (" + value + ") for CGT.Sound Object!";
                alert(message); 
                throw message;
            }
        }

        // The volume, pitch, and pan setters keep the values in valid ranges.
        set volume(value) 
        {
            this._volume =                  Number.clamp(value, CGT.Sound.minVolume, CGT.Sound.maxVolume); 
        }

        set pitch(value)
        {
            this._pitch =                   Number.clamp(value, CGT.Sound.minPitch, CGT.Sound.maxPitch);
        }

        set pan(value)
        {
            this._pan =                     Number.clamp(value, CGT.Sound.minPan, CGT.Sound.maxPan);
        }

        // Methods
        /**
         * 
         * @param {string} fileName 
         * @param {CGT.SoundType} soundType 
         * @param {number} volume 
         * @param {number} pitch 
         * @param {number} pan 
         */
        constructor(fileName, soundType, volume, pitch, pan)
        {

            this.name =                 fileName;
            this.type =                 soundType;
            this.volume =               volume;
            this.pitch =                pitch;
            this.pan =                  pan;
        }

        play()
        {
            // Based on this object's sound type, decide which AudioManager func should play this.
            if (this.type === CGT.SoundType.bgm)
                AudioManager.playBgm(this);
            else if (this.type === CGT.SoundType.bgs)
                AudioManager.playBgs(this);
            else if (this.type === CGT.SoundType.me)
                AudioManager.playMe(this);
            else if (this.type === CGT.SoundType.se)
                AudioManager.playSe(this);
            else
            {
                let message =                       "Not accounted for CGT SoundType " + this.type;
                alert(message);
                throw message;
            }
        }

        _removeExtensionFromName()
        {
            let dotIndex =                          this.name.indexOf('.');
            if (dotIndex >= 0) // Don't use the setter here; it'd cause infinite recursion
                this._name =                        this._name.substring(0, dotIndex);
        }
    };

    // Have to set static fields outside of class declaration
    // Valid value ranges, as imposed by MV's sound player
    CGT.Sound.minVolume =                   0;
    CGT.Sound.maxVolume =                   100;
    CGT.Sound.minPitch =                    -100;
    CGT.Sound.maxPitch =                    100;
    CGT.Sound.minPan =                      -100;
    CGT.Sound.maxPan =                      100;

    // Because regular JS objects aren't good enough.
    CGT.Dictionary =                        class
    {
        // The keys always have the same indexes as their values.

        // Getters
        get keys()                          { return this._keys; }

        // Methods
        constructor()
        {
            this._keys =                    [];
            this._values =                  [];
        }

        /** 
         * Adds the passed key-value pair to this dictionary. If the key was 
         * already added, the value is overwritten. 
         * */
        add(key, value)
        {
            if (this.hasKey(key))
            {
                let index =                 this._keys.indexOf(key);
                this._values[index] =       value;
            }
            else
            {
                this._keys.push(key);
                this._values.push(value);
            }
        }

        /** 
         * Removes the key (and its mapped value) from this dictionary.
         * Returns true if successful, false otherwise.
         *  */
        remove(key)
        {
            if (this.hasKey(key))
            {
                let index =                 this._keys.indexOf(key);
                this._keys.splice(index, 1);
                this._values.splice(index, 1);
                return true;
            }
        }

        /** Returns the value mapped to the passed key, if there is one. Returns null otherwise. */
        get(key)
        {
            if (this.hasKey(key))
            {
                let index =                 this._keys.indexOf(key);
                return this._values[index];
            }
            else
                return null;
        }

        getAtIndex(index)
        {
            if (index >= 0 && index < this.keys.length)
                return this._values[index];
        }

        hasKey(key)
        {
            return this._keys.includes(key);
        }

        /** @returns {number} Returns how many key-value pairs there are in this dictionary. */
        length()
        {
            return this._keys.length;
        }

        /** Removes all key-value pairs from this dictionary. */
        clear()
        {
            this._keys =                    [];
            this._values =                  [];
        }


    };

    // For the Observer pattern.
    CGT.Event =                             class
    {
        // Getters
        get argCount()                      { return this._argCount; }

        /** Throws an exception if a negative number of args are passed. */
        constructor(argCount)
        {
            // Dictionary with the callers as the keys, and arrays of funcs as the values
            this._callbacks =                        new CGT.Dictionary();
            this._argCount =                         0;
            this._invocationStr =                    ""; // Will be eval'd to execute the funcs
            this._funcToCall =                       undefined;
            this._callerName =                       "caller";

            // Validation
            if (argCount >= 0)
                this._argCount =            argCount;
            else
            {
                let message =               "Cannot init CGT Event with a negative arg count.";
                alert(message);
                throw message;
            }

            this._setupCallbackInvocationString();
        }

        /**
         * @param {function} func Function to call when invoked
         * @param {*} caller Effective caller of the function.
         */
        addListener(func, caller)
        {
            if (this._callbacks.get(caller) == null)
                this._callbacks.add(caller, []);

            this._callbacks.get(caller).push(func);
        }

        removeListener(func, caller)
        {
            if (this._callbacks.get(caller) == null)
                return;
            
            this._callbacks.get(caller).remove(func);
        }

        /** 
         * Invokes all callbacks registered under this event. Throws an exception if an inappropriate
         * number of args is passed.
         * @param {any} args  
         * */
        invoke(args)
        {
            // Safety
            if (arguments.length != this.argCount)
            {
                let message =               "ERROR: call to CGT.Event invoke() passed wrong amount of arguments. \
                Amount passed: ${arguments.length} Amount Needed: ${this.argCount}";
                alert(message);
                throw message;
            }

            // Going through the callers...
            let callers =                   this._callbacks.keys;
            for (let i = 0; i < callers.length; i++)
            {
                let caller =                callers[i];

                // Go through all the funcs registered under the caller, and execute them one by 
                // one with this object's invocation string.
                let toExecute =             this._callbacks.get(caller);

                for (let i = 0; i < toExecute.length; i++)
                {
                    this._funcToCall =      toExecute[i];
                    eval(this._invocationStr);
                }
                
            }
        }

        _setupCallbackInvocationString()
        {
            this._invocationStr =                   "this._funcToCall.call(" + this._callerName;
            if (this.argCount > 0)
                this._invocationStr +=              ", ";
            else
                this._invocationStr +=              ")";

            for (let i = 0; i < this.argCount; i++)
            {
                let argString =                     "arguments[" + i + "]";
                if (i == this.argCount - 1) // Are we at the last arg?
                    argString +=                    ');';
                else
                    argString +=                    ', ';

                this._invocationStr +=              argString;
            }
        }
    };

})();

// Extensions to preexisting APIs dependent on this script's custom utils
(function()
{
    
})();

// Setting up callbacks
(function()
{
    // Events
    CGT.Callbacks =                         {};
    CGT.Callbacks.TitleScreenStart =        new CGT.Event(0);
    CGT.Callbacks.BattleStart =             new CGT.Event(0);
    CGT.Callbacks.BattleEnd =               new CGT.Event(1);
    CGT.Callbacks.DamageExecute =           new CGT.Event(2);
    CGT.Callbacks.EnemyDeath =              new CGT.Event(1);

    // Funcs to alias
    let oldSceneTitleStart =                Scene_Title.prototype.start;
    let oldStartBattle =                    BattleManager.startBattle;
    let oldEndBattle =                      BattleManager.endBattle;
    let oldExecuteDamage =                  Game_Action.prototype.executeDamage;
    let oldEnemyDeath =                     Game_Enemy.prototype.die;

    // Func aliases
    function newSceneTitleStart()
    {
        oldSceneTitleStart.call(this);
        CGT.Callbacks.TitleScreenStart.invoke();
    }

    function newStartBattle()
    {
        oldStartBattle.call(this);
        CGT.Callbacks.BattleStart.invoke();
    }

    function newEndBattle(result)
    {
        oldEndBattle.call(this, result);
        CGT.Callbacks.BattleEnd.invoke(result);
    }

    function newExecuteDamage(target, value)
    {
        oldExecuteDamage.call(this, target, value);
        CGT.Callbacks.DamageExecute.invoke(target, value);
    }

    function newEnemyDie()
    {
        oldEnemyDeath.call(this);
        CGT.Callbacks.EnemyDeath.invoke(this);
    }

    // Applying func aliases
    Scene_Title.prototype.start =               newSceneTitleStart;
    BattleManager.startBattle =                 newStartBattle;
    BattleManager.endBattle =                   newEndBattle;
    Game_Action.prototype.executeDamage =       newExecuteDamage;
    Game_Enemy.prototype.die =                  newEnemyDie;

})();