/** 
 * @file Implementation Web Crypto random generatore for GOST algorithms
 * @version 0.99
 * @copyright 2014, Rudolf Nickolaev. All rights reserved.
 */

/*
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 */

(function(root, factory) {
    
    /*
     * Module imports and exports
     * 
     */ // <editor-fold defaultstate="collapsed">
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.gostRandom = factory();
    }
    // </editor-fold>
    
}(this, function() {

    /**
     * The gostCrypto provide general purpose cryptographic functionality for
     * GOST standards including a cryptographically strong pseudo-random number 
     * generator seeded with truly random values.
     * 
     * @namespace gostRandom
     * 
     */ // <editor-fold defaultstate="collapsed">

    var root = this;
    var rootCrypto = root.crypto || root.msCrypto;

    var TypeMismatchError = root.TypeMismatchError || Error;
    var QuotaExceededError = root.QuotaExceededError || Error;

    // Initialize mouse and time counters for random generator    
    var randomRing = {
        seed: new Uint8Array(1024),
        getIndex: 0,
        setIndex: 0,
        set: function(x) {
            if (this.setIndex >= 1024)
                this.setIndex = 0;
            this.seed[this.setIndex++] = x;
        },
        get: function() {
            if (this.getIndex >= 1024)
                this.getIndex = 0;
            return this.seed[this.getIndex++];
        }
    };

    if (typeof document !== 'undefiend') {
        try {
            // Mouse move event to fill random array
            document.addEventListener('mousemove', function(e) {
                randomRing.set((new Date().getTime() & 255) ^
                        ((e.clientX || e.pageX) & 255) ^
                        ((e.clientY || e.pageY) & 255));
            }, false);
        } catch (e) {
        }

        try {
            // Keypress event to fill random array
            document.addEventListener('keydown', function(e) {
                randomRing.set((new Date().getTime() & 255) ^
                        (e.keyCode & 255));
            }, false);
        } catch (e) {
        }
    } // </editor-fold>

    var gostRandom = {}; 

    /**
     * The getRandomValues method generates cryptographically random values. <br><br>
     * 
     * Random generator based on JavaScript Web Crypto random genereator 
     * (if it is possible) or  Math.random mixed with time and parameters of 
     * mouse and keyboard events
     * 
     * @memberOf gostRandom
     * @param {(ArrayBuffer|ArrayBufferView)} array Destination buffer for random data
     */ 
    gostRandom.getRandomValues = function(array) // <editor-fold defaultstate="collapsed">
    {

        if (!array.byteLength)
            throw new TypeMismatchError('Array is not of an integer type (Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, or Uint32Array)');

        if (array.byteLength > 65536)
            throw new QuotaExceededError('Byte length of array can\'t be greate then 65536');

        var u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        if (rootCrypto && rootCrypto.getRandomValues) {
            // Native window cryptographic interface
            rootCrypto.getRandomValues(u8);
        } else {
            // Standard Javascript method
            for (var i = 0, n = u8.length; i < n; i++)
                u8[i] = Math.floor(256 * Math.random()) & 255;
        }

        // Mix bio randomizator
        for (var i = 0, n = u8.length; i < n; i++)
            u8[i] = u8[i] ^ randomRing.get();
        return array;
    }; // </editor-fold>

    return gostRandom;

}));
