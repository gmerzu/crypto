/**
 * @file Coding algorithms: Base64, Hex, Chars, BER, PEM
 * @version 0.99
 * @copyright 2014-2015, Rudolf Nickolaev. All rights reserved.
 */

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *    
 * THIS SOfTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES Of MERCHANTABILITY AND fITNESS fOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * fOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT Of SUBSTITUTE GOODS OR
 * SERVICES; LOSS Of USE, DATA, OR PROfITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY Of LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT Of THE USE
 * Of THIS SOfTWARE, EVEN If ADVISED Of THE POSSIBILITY OF SUCH DAMAGE.
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
        root.gostCoding = factory();
    }
    // </editor-fold>

}(this, function() {

    /**
     * The Coding interface provides string converting methods.
     * @namespace gostCoding
     * 
     */ // <editor-fold defaultstate="collapsed">
    var root = this;

    function buffer(d) {
        if (d instanceof ArrayBuffer)
            return d;
        else if (d && d.buffer && d.buffer instanceof ArrayBuffer)
            return d.byteOffset === 0 && d.byteLength === d.buffer.byteLength ?
                    d.buffer : new Uint8Array(new Uint8Array(d, d.byteOffset, d.byteLength)).buffer;
        else
            throw new (root.DataError || Error)('ArrayBuffer or TypedArray required');
    } // </editor-fold>

    var gostCoding = {};

    /**
     * BASE64 conversion
     * 
     * @class gostCoding.Base64
     */
    gostCoding.Base64 = {// <editor-fold defaultstate="collapsed">
        /**
         * Base64.decode convert BASE64 string s to ArrayBuffer
         * 
         * @memberOf gostCoding.Base64
         * @param {String} s BASE64 encoded string value
         * @returns {ArrayBuffer} Binary decoded data
         */
        decode: function(s) {
            s = s.replace(/[^A-Za-z0-9\+\/]/g, '');
            var n = s.length,
                    k = n * 3 + 1 >> 2, r = new Uint8Array(k);

            for (var m3, m4, u24 = 0, j = 0, i = 0; i < n; i++) {
                m4 = i & 3;
                var c = s.charCodeAt(i);

                c = c > 64 && c < 91 ?
                        c - 65 : c > 96 && c < 123 ?
                        c - 71 : c > 47 && c < 58 ?
                        c + 4 : c === 43 ?
                        62 : c === 47 ?
                        63 : 0;

                u24 |= c << 18 - 6 * m4;
                if (m4 === 3 || n - i === 1) {
                    for (m3 = 0; m3 < 3 && j < k; m3++, j++) {
                        r[j] = u24 >>> (16 >>> m3 & 24) & 255;
                    }
                    u24 = 0;

                }
            }
            return r.buffer;
        },
        /**
         * Base64.encode(data) convert ArrayBuffer data to BASE64 string
         * 
         * @memberOf gostCoding.Base64
         * @param {(ArrayBuffer|TypedArray)} data Bynary data for encoding
         * @returns {String} BASE64 encoded data
         */
        encode: function(data) {
            var slen = 8, d = new Uint8Array(buffer(data));
            var m3 = 2, s = '';
            for (var n = d.length, u24 = 0, i = 0; i < n; i++) {
                m3 = i % 3;
                if (i > 0 && (i * 4 / 3) % (12 * slen) === 0)
                    s += '\r\n';
                u24 |= d[i] << (16 >>> m3 & 24);
                if (m3 === 2 || n - i === 1) {
                    for (var j = 18; j >= 0; j -= 6) {
                        var c = u24 >>> j & 63;
                        c = c < 26 ? c + 65 : c < 52 ? c + 71 : c < 62 ? c - 4 :
                                c === 62 ? 43 : c === 63 ? 47 : 65;
                        s += String.fromCharCode(c);
                    }
                    u24 = 0;
                }
            }
            return s.substr(0, s.length - 2 + m3) + (m3 === 2 ? '' : m3 === 1 ? '=' : '==');
        } // </editor-fold>
    };

    /**
     * Text string conversion
     * 
     * Methods support charsets: ascii, win1251, utf8, utf16 (ucs2, unicode), utf32 (ucs4)
     * 
     * @class gostCoding.Chars
     */
    gostCoding.Chars = (function() { // <editor-fold defaultstate="collapsed">

        var _win1251_ = {
            0x402: 0x80, 0x403: 0x81, 0x201A: 0x82, 0x453: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
            0x20AC: 0x88, 0x2030: 0x89, 0x409: 0x8A, 0x2039: 0x8B, 0x40A: 0x8C, 0x40C: 0x8D, 0x40B: 0x8E, 0x40f: 0x8f,
            0x452: 0x90, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
            0x2122: 0x99, 0x459: 0x9A, 0x203A: 0x9B, 0x45A: 0x9C, 0x45C: 0x9D, 0x45B: 0x9E, 0x45f: 0x9f,
            0xA0: 0xA0, 0x40E: 0xA1, 0x45E: 0xA2, 0x408: 0xA3, 0xA4: 0xA4, 0x490: 0xA5, 0xA6: 0xA6, 0xA7: 0xA7,
            0x401: 0xA8, 0xA9: 0xA9, 0x404: 0xAA, 0xAB: 0xAB, 0xAC: 0xAC, 0xAD: 0xAD, 0xAE: 0xAE, 0x407: 0xAf,
            0xB0: 0xB0, 0xB1: 0xB1, 0x406: 0xB2, 0x456: 0xB3, 0x491: 0xB4, 0xB5: 0xB5, 0xB6: 0xB6, 0xB7: 0xB7,
            0x451: 0xB8, 0x2116: 0xB9, 0x454: 0xBA, 0xBB: 0xBB, 0x458: 0xBC, 0x405: 0xBD, 0x455: 0xBE, 0x457: 0xBf
        };
        var _win1251back_ = {};
        for (var from in _win1251_) {
            var to = _win1251_[from];
            _win1251back_[to] = from;
        }

        return {
            /**
             * Chars.decode(s, charset) convert string s with defined charset to ArrayBuffer 
             * 
             * @memberOf gostCoding.Chars
             * @param {string} s Javascript string
             * @param {string} charset Charset, default 'win1251'
             * @returns {ArrayBuffer} Decoded binary data
             */
            decode: function(s, charset) {
                charset = (charset || 'win1251').toLowerCase().replace('-', '');
                var r = [];
                for (var i = 0, j = s.length; i < j; i++) {
                    var c = s.charCodeAt(i);
                    if (charset === 'utf8') {
                        if (c < 0x80) {
                            r.push(c);
                        } else if (c < 0x800) {
                            r.push(0xc0 + (c >>> 6));
                            r.push(0x80 + (c & 63));
                        } else if (c < 0x10000) {
                            r.push(0xe0 + (c >>> 12));
                            r.push(0x80 + (c >>> 6 & 63));
                            r.push(0x80 + (c & 63));
                        } else if (c < 0x200000) {
                            r.push(0xf0 + (c >>> 18));
                            r.push(0x80 + (c >>> 12 & 63));
                            r.push(0x80 + (c >>> 6 & 63));
                            r.push(0x80 + (c & 63));
                        } else if (c < 0x4000000) {
                            r.push(0xf8 + (c >>> 24));
                            r.push(0x80 + (c >>> 18 & 63));
                            r.push(0x80 + (c >>> 12 & 63));
                            r.push(0x80 + (c >>> 6 & 63));
                            r.push(0x80 + (c & 63));
                        } else {
                            r.push(0xfc + (c >>> 30));
                            r.push(0x80 + (c >>> 24 & 63));
                            r.push(0x80 + (c >>> 18 & 63));
                            r.push(0x80 + (c >>> 12 & 63));
                            r.push(0x80 + (c >>> 6 & 63));
                            r.push(0x80 + (c & 63));
                        }
                    } else if (charset === 'uncode' || charset === 'ucs2' || charset === 'utf16') {
                        if (c < 0xD800 || (c >= 0xE000 && c <= 0x10000)) {
                            r.push(c >>> 8);
                            r.push(c & 0xff);
                        } else if (c >= 0x10000 && c < 0x110000) {
                            c -= 0x10000;
                            var first = ((0xffc00 & c) >> 10) + 0xD800;
                            var second = (0x3ff & c) + 0xDC00;
                            r.push(first >>> 8);
                            r.push(first & 0xff);
                            r.push(second >>> 8);
                            r.push(second & 0xff);
                        }
                    } else if (charset === 'utf32' || charset === 'ucs4') {
                        r.push(c >>> 24 & 0xff);
                        r.push(c >>> 16 & 0xff);
                        r.push(c >>> 8 & 0xff);
                        r.push(c & 0xff);
                    } else if (charset === 'win1251') {
                        if (c >= 0x80) {
                            if (c >= 0x410 && c < 0x450) // А..Яа..я
                                c -= 0x350;
                            else
                                c = _win1251_[c] || 0;
                        }
                        r.push(c);
                    } else
                        r.push(c & 0xff);
                }
                return new Uint8Array(r).buffer;
            },
            /**
             * Chars.encode(data, charset) convert ArrayBuffer data to string with defined charset
             * 
             * @memberOf gostCoding.Chars
             * @param {(ArrayBuffer|TypedArray)} data Binary data
             * @param {string} charset Charset, default win1251
             * @returns {string} Encoded javascript string
             */
            encode: function(data, charset) {
                charset = (charset || 'win1251').toLowerCase().replace('-', '');
                var r = [], d = new Uint8Array(buffer(data));
                for (var i = 0, n = d.length; i < n; i++) {
                    var c = d[i];
                    if (charset === 'utf8') {
                        c = c >= 0xfc && c < 0xfe && i + 5 < n ? // six bytes
                                (c - 0xfc) * 1073741824 + (d[++i] - 0x80 << 24) + (d[++i] - 0x80 << 18) + (d[++i] - 0x80 << 12) + (d[++i] - 0x80 << 6) + d[++i] - 0x80
                                : c >> 0xf8 && c < 0xfc && i + 4 < n ? // five bytes 
                                (c - 0xf8 << 24) + (d[++i] - 0x80 << 18) + (d[++i] - 0x80 << 12) + (d[++i] - 0x80 << 6) + d[++i] - 0x80
                                : c >> 0xf0 && c < 0xf8 && i + 3 < n ? // four bytes 
                                (c - 0xf0 << 18) + (d[++i] - 0x80 << 12) + (d[++i] - 0x80 << 6) + d[++i] - 0x80
                                : c >= 0xe0 && c < 0xf0 && i + 2 < n ? // three bytes 
                                (c - 0xe0 << 12) + (d[++i] - 0x80 << 6) + d[++i] - 0x80
                                : c >= 0xc0 && c < 0xe0 && i + 1 < n ? // two bytes 
                                (c - 0xc0 << 6) + d[++i] - 0x80
                                : c; // one byte 
                    } else if (charset === 'uncode' || charset === 'ucs2' || charset === 'utf16') {
                        c = (c << 8) + d[++i];
                        if (c >= 0xD800 && c < 0xE000) {
                            var first = (c - 0xD800) << 10;
                            c = d[++i];
                            c = (c << 8) + d[++i];
                            var second = c - 0xDC00;
                            c = first + second + 0x10000;
                        }
                    } else if (charset === 'utf32' || charset === 'ucs4') {
                        c = (c << 8) + d[++i];
                        c = (c << 8) + d[++i];
                        c = (c << 8) + d[++i];
                    } else if (charset === 'win1251') {
                        if (c >= 0x80) {
                            if (c >= 0xC0 && c < 0x100)
                                c += 0x350; // А..Яа..я
                            else
                                c = _win1251back_[c] || 0;
                        }
                    }
                    r.push(String.fromCharCode(c));
                }
                return r.join('');
            }
        }; // </editor-fold>
    })();

    /**
     * HEX conversion
     * 
     * @class gostCoding.Hex
     */
    gostCoding.Hex = {// <editor-fold defaultstate="collapsed">
        /**
         * Hex.decode(s, endean) convert HEX string s to ArrayBuffer in endean mode
         * 
         * @memberOf gostCoding.Hex
         * @param {string} s Hex encoded string
         * @param {boolean} endean Little or Big Endean, default Little
         * @returns {ArrayBuffer} Decoded binary data
         */
        decode: function(s, endean) {
            s = s.replace(/[^A-fa-f0-9]/g, '');
            var n = Math.ceil(s.length / 2), r = new Uint8Array(n);
            s = (s.length % 2 > 0 ? '0' : '') + s;
            if (endean && ((typeof endean !== 'string') ||
                    (endean.toLowerCase().indexOf('little') < 0)))
                for (var i = 0; i < n; i++)
                    r[i] = parseInt(s.substr((n - i - 1) * 2, 2), 16);
            else
                for (var i = 0; i < n; i++)
                    r[i] = parseInt(s.substr(i * 2, 2), 16);
            return r.buffer;
        },
        /**
         * Hex.encode(data, endean) convert ArrayBuffer data to HEX string in endean mode
         * 
         * @memberOf gostCoding.Hex 
         * @param {(ArrayBuffer|TypedArray)} data Binary data
         * @param {boolean} endean Little/Big Endean, default Little
         * @returns {string} Hex decoded string
         */
        encode: function(data, endean) {
            var s = [], d = new Uint8Array(buffer(data)), n = d.length;
            if (endean && ((typeof endean !== 'string') ||
                    (endean.toLowerCase().indexOf('little') < 0)))
                for (var i = 0; i < n; i++) {
                    var j = n - i - 1;
                    s[j] = (j > 0 && j % 32 === 0 ? '\r\n' : '') +
                            ('00' + d[i].toString(16)).slice(-2);
                }
            else
                for (var i = 0; i < n; i++)
                    s[i] = (i > 0 && i % 32 === 0 ? '\r\n' : '') +
                            ('00' + d[i].toString(16)).slice(-2);
            return s.join('');
        } // </editor-fold>
    };

    /**
     * String hex-encoded integer conversion
     * 
     * @class gostCoding.Int16
     */
    gostCoding.Int16 = {// <editor-fold defaultstate="collapsed">
        /**
         * Int16.decode(s) convert hex big insteger s to ArrayBuffer
         * 
         * @memberOf gostCoding.Int16 
         * @param {string} s Int16 string 
         * @returns {ArrayBuffer} Decoded binary data
         */
        decode: function(s) {
            s = (s || '').replace(/[^\-A-fa-f0-9]/g, '');
            if (s.length === 0)
                s = '0';
            // Signature
            var neg = false;
            if (s.charAt(0) === '-') {
                neg = true;
                s = s.substring(1);
            }
            // Align 2 chars
            while (s.charAt(0) === '0' && s.length > 1)
                s = s.substring(1);
            s = (s.length % 2 > 0 ? '0' : '') + s;
            // Padding for singanuture
            // '800000' - 'ffffff' - for positive
            // '800001' - 'ffffff' - for negative
            if ((!neg && !/^[0-7]/.test(s)) ||
                    (neg && !/^[0-7]|8[0]+$/.test(s)))
                s = '00' + s;
            // Convert hex
            var n = s.length / 2, r = new Uint8Array(n), t = 0;
            for (var i = n - 1; i >= 0; --i) {
                var c = parseInt(s.substr(i * 2, 2), 16);
                if (neg && (c + t > 0)) {
                    c = 256 - c - t;
                    t = 1;
                }
                r[i] = c;
            }
            return r.buffer;
        },
        /**
         * Int16.encode(data) convert ArrayBuffer data to big integer hex string
         * 
         * @memberOf gostCoding.Int16
         * @param {(ArrayBuffer|TypedArray)} data Binary data
         * @returns {string} Int16 encoded string
         */
        encode: function(data) {
            var d = new Uint8Array(buffer(data)), n = d.length;
            if (d.length === 0)
                return '0x00';
            var s = [], neg = d[0] > 0x7f, t = 0;
            for (var i = n - 1; i >= 0; --i) {
                var v = d[i];
                if (neg && (v + t > 0)) {
                    v = 256 - v - t;
                    t = 1;
                }
                s[i] = ('00' + v.toString(16)).slice(-2);
            }
            s = s.join('');
            while (s.charAt(0) === '0')
                s = s.substring(1);
            return (neg ? '-' : '') + '0x' + s;
        } // </editor-fold>
    };

    /**
     * BER, DER, CER conversion
     * 
     * @class gostCoding.BER
     */
    gostCoding.BER = (function() { // <editor-fold defaultstate="collapsed">

        var BERtypes = {
            0x00: 'EOC',
            0x01: 'BOOLEAN',
            0x02: 'INTEGER',
            0x03: 'BIT STRING',
            0x04: 'OCTET STRING',
            0x05: 'NULL',
            0x06: 'OBJECT IDENTIFIER',
            0x07: 'ObjectDescriptor',
            0x08: 'EXTERNAL',
            0x09: 'REAL',
            0x0A: 'ENUMERATED',
            0x0B: 'EMBEDDED PDV',
            0x0C: 'UTF8String',
            0x10: 'SEQUENCE',
            0x11: 'SET',
            0x12: 'NumericString',
            0x13: 'PrintableString', // ASCII subset
            0x14: 'TeletexString', // aka T61String
            0x15: 'VideotexString',
            0x16: 'IA5String', // ASCII
            0x17: 'UTCTime',
            0x18: 'GeneralizedTime',
            0x19: 'GraphicString',
            0x1A: 'VisibleString', // ASCII subset
            0x1B: 'GeneralString',
            0x1C: 'UniversalString',
            0x1E: 'BMPString'
        };

        // Predefenition block
        function encodeBER(s, format) {
            // Correct primitive type
            if (typeof s === 'undefined' || s === null)
                s = new String('');
            else if (typeof s === 'string')
                s = new String(s);
            else if (typeof s === 'number')
                s = new Number(s);
            else if (typeof s === 'boolean')
                s = new Boolean(s);

            // Determinate tagClass
            var tagClass = s.tagClass = s.tagClass || 0; // Universial default

            // Determinate tagNumber. Use only for Universal class
            var tagNumber;
            if (tagClass === 0)
                tagNumber = s.tagNumber;
            if (typeof tagNumber === 'undefined') {

                if (s instanceof String) {
                    if (tagClass === 0) { // Universal class
                        if (s.toString() === '')   // NULL
                            tagNumber = 0x05;
                        else if (/^\-?0x[0-9a-fA-F]+$/.test(s)) // INTEGER
                            tagNumber = 0x02;
                        else if (/^(\d+\.)+\d+$/.test(s)) // OID
                            tagNumber = 0x06;
                        else if (/^[01]+$/.test(s)) // BIT STRING
                            tagNumber = 0x03;
                        else if (/^(true|false)$/.test(s)) // BOOLEAN
                            tagNumber = 0x01;
                        else if (/^[0-9a-fA-F]+$/.test(s)) // OCTET STRING
                            tagNumber = 0x04;
                        else
                            tagNumber = 0x13; // Printable string (later can be changed to UTF8String)
                    } else { // Other class
                        if (/^[0-9a-fA-F]+$/.test(s)) // OCTET STRING
                            tagNumber = 0x04; // Other classes must encoded string as hex string
                        else
                            tagNumber = 0x13; // Possibly it is a mistake, but needs to encode for any case
                    }
                } else if (s instanceof Number) { // INTEGER
                    tagNumber = 0x02;
                } else if (s instanceof Date) { // GeneralizedTime
                    tagNumber = 0x18;
                } else if (s instanceof Boolean) { // BOOLEAN
                    tagNumber = 0x01;
                } else if (s instanceof Array) { // SEQUENCE
                    tagNumber = 0x10;
                } else if (s instanceof ArrayBuffer || s.buffer instanceof ArrayBuffer) {
                    tagNumber = 0x04;
                } else
                    throw new (root.DataError || Error)('Unrecognized type for ' + s);
            }

            // Determinate constructed
            var tagConstructed = s.tagConstructed;
            if (typeof tagConstructed === 'undefined')
                tagConstructed = s.tagConstructed = s instanceof Array;

            // Create content
            var content;
            if (s instanceof ArrayBuffer || s.buffer instanceof ArrayBuffer) { // Direct
                content = new Uint8Array(buffer(s));
                if (tagNumber === 0x03) { // BITSTRING
                    // Set unused bits
                    var a = new Uint8Array(buffer(content));
                    content = new Uint8Array(a.length + 1);
                    content[0] = 0; // No unused bits
                    content.set(a, 1);
                }
            } else if (tagConstructed) { // Sub items coding
                if (s instanceof Array) {
                    var bytelen = 0, ba = [], offset = 0;
                    for (var i = 0, n = s.length; i < n; i++) {
                        ba[i] = encodeBER(s[i], format);
                        bytelen += ba[i].length;
                    }
                    if (tagConstructed && format === 'CER') { // final for CER 00 00
                        ba[n] = new Uint8Array(2);
                        bytelen += 2;
                    }
                    content = new Uint8Array(bytelen);
                    for (var i = 0, n = ba.length; i < n; i++) {
                        content.set(ba[i], offset);
                        offset = offset + ba[i].length;
                    }
                } else
                    throw new (root.DataError || Error)('Constracted block can\'t be primitive');
            } else {
                switch (tagNumber) {
                    // 0x00: // EOC
                    case 0x01: // BOOLEAN
                        content = new Uint8Array(1);
                        content[0] = s.toString() === 'true' ? 1 : 0;
                        break;
                    case 0x02: // INTEGER
                    case 0x0a: // ENUMIRATED
                        content = gostCoding.Int16.decode(
                                s instanceof Number ? '0x' + s.toString(16) : s.toString());
                        break;
                    case 0x03: // BIT STRING
                        if (typeof s === 'string' || s instanceof String) {
                            var unusedBits = 7 - (s.length + 7) % 8;
                            var n = Math.ceil(s.length / 8);
                            content = new Uint8Array(n + 1);
                            content[0] = unusedBits;
                            for (var i = 0; i < n; i++) {
                                var c = 0;
                                for (var j = 0; j < 8; j++) {
                                    var k = i * 8 + j;
                                    c = (c << 1) + (k < s.length ? (s.charAt(k) === '1' ? 1 : 0) : 0);
                                }
                                content[i + 1] = c;
                            }
                        }
                        break;
                    case 0x04:
                        content = gostCoding.Hex.decode(
                                s instanceof Number ? s.toString(16) : s);
                        break;
                        // case 0x05: // NULL
                    case 0x06: // OBJECT IDENTIFIER
                        var a = s.match(/\d+/g), r = [];
                        for (var i = 1; i < a.length; i++) {
                            var n = +a[i], r1 = [];
                            if (i === 1)
                                n = n + a[0] * 40;
                            do {
                                r1.push(n & 0x7F);
                                n = n >>> 7;
                            } while (n);
                            // reverse order
                            for (j = r1.length - 1; j >= 0; --j)
                                r.push(r1[j] + (j === 0 ? 0x00 : 0x80));
                        }
                        content = new Uint8Array(r);
                        break;
                        // case 0x07: // ObjectDescriptor
                        // case 0x08: // EXTERNAL
                        // case 0x09: // REAL
                        // case 0x0A: // ENUMERATED
                        // case 0x0B: // EMBEDDED PDV
                    case 0x0C: // UTF8String
                        content = gostCoding.Chars.decode(s, 'utf8');
                        break;
                        // case 0x10: // SEQUENCE
                        // case 0x11: // SET
                    case 0x12: // NumericString
                    case 0x16: // IA5String // ASCII
                    case 0x13: // PrintableString // ASCII subset
                    case 0x14: // TeletexString // aka T61String
                    case 0x15: // VideotexString
                    case 0x19: // GraphicString
                    case 0x1A: // VisibleString // ASCII subset
                    case 0x1B: // GeneralString
                        // Reflect on character encoding
                        for (var i = 0, n = s.length; i < n; i++)
                            if (s.charCodeAt(i) > 255)
                                tagNumber = 0x0C;
                        if (tagNumber === 0x0C)
                            content = gostCoding.Chars.decode(s, 'utf8');
                        else
                            content = gostCoding.Chars.decode(s, 'ascii');
                        break;
                    case 0x17: // UTCTime
                    case 0x18: // GeneralizedTime
                        var d = new Date(s);
                        d.setMinutes(d.getMinutes() + d.getTimezoneOffset()); // to UTC
                        var r = (tagNumber === 0x17 ? d.getYear().toString().slice(-2) : d.getFullYear().toString()) +
                                ('00' + (d.getMonth() + 1)).slice(-2) +
                                ('00' + d.getDate()).slice(-2) +
                                ('00' + d.getHours()).slice(-2) +
                                ('00' + d.getMinutes()).slice(-2) +
                                ('00' + d.getSeconds()).slice(-2) + 'Z';
                        content = gostCoding.Chars.decode(r, 'ascii');
                        break;
                    case 0x1C: // UniversalString
                        content = gostCoding.Chars.decode(s, 'utf32');
                        break;
                    case 0x1E: // BMPString
                        content = gostCoding.Chars.decode(s, 'utf16');
                        break;
                }
            }
            if (!content)
                content = new Uint8Array(0);
            if (content instanceof ArrayBuffer)
                content = new Uint8Array(content);

            // Restore tagNumber for all classes
            if (tagClass === 0)
                s.tagNumber = tagNumber;
            else
                s.tagNumber = tagNumber = (s.tagNumber || 0);
            s.content = content;

            // Create header
            // tagNumber
            var ha = [], first = tagClass === 3 ? 0xC0 : tagClass === 2 ? 0x80 :
                    tagClass === 1 ? 0x40 : 0x00;
            if (tagConstructed)
                first |= 0x20;
            if (tagNumber < 0x1F) {
                first |= tagNumber & 0x1F;
                ha.push(first);
            } else {
                first |= 0x1F;
                ha.push(first);
                var n = tagNumber, ha1 = [];
                do {
                    ha1.push(n & 0x7F);
                    n = n >>> 7;
                } while (n)
                // reverse order
                for (var j = ha1.length - 1; j >= 0; --j)
                    ha.push(ha1[j] + (j === 0 ? 0x00 : 0x80));
            }
            // Length
            if (tagConstructed && format === 'CER') {
                ha.push(0x80);
            } else {
                var len = content.length;
                if (len > 0x7F) {
                    var l2 = len, ha2 = [];
                    do {
                        ha2.push(l2 & 0xff);
                        l2 = l2 >>> 8;
                    } while (l2);
                    ha.push(ha2.length + 0x80); // reverse order
                    for (var j = ha2.length - 1; j >= 0; --j)
                        ha.push(ha2[j]);
                } else {
                    // simple len
                    ha.push(len);
                }
            }
            var header = s.header = new Uint8Array(ha);

            // type name
            var typeName = tagClass === 1 ? 'Application_' + tagNumber :
                    tagClass === 2 ? '[' + tagNumber.toString() + ']' : // Context
                    tagClass === 3 ? 'Private_' + tagNumber :
                    BERtypes[tagNumber] || "Universal_" + tagNumber.toString();
            s.typeName = typeName;

            // Result - complete buffer
            var block = new Uint8Array(header.length + content.length);
            block.set(header, 0);
            block.set(content, header.length);
            return block;
        }

        function decodeBER(d, offset) {

            // start pos
            var pos = offset || 0;

            // Read tag
            var buf = d[pos++],
                    tagClass = buf >> 6,
                    constructed = (buf & 0x20) !== 0;
            var tagNumber = buf & 0x1f;
            if (tagNumber === 0x1f) { // long tag
                tagNumber = 0;
                do {
                    if (tagNumber > 0x1fffffffffff80)
                        throw new (root.DataError || Error)('Convertor not supported tag number more then (2^53 - 1) at position ' + offset);
                    buf = d[pos++];
                    tagNumber = (tagNumber << 7) + (buf & 0x7f);
                } while (buf & 0x80);
            }

            // Read len        
            buf = d[pos++];
            var len = buf & 0x7f;
            if (len !== buf) {
                if (len > 6) // no reason to use Int10, as it would be a huge buffer anyways
                    throw new (root.DataError || Error)('Length over 48 bits not supported at position ' + offset);
                if (len === 0)
                    len = null; // undefined
                else {
                    buf = 0;
                    for (var i = 0; i < len; ++i)
                        buf = (buf << 8) + d[pos++];
                    len = buf;
                }
            }

            var start = pos, sub = null;

            if (constructed) {
                // must have valid content
                sub = [];
                if (len !== null) {
                    // definite length
                    var end = start + len;
                    while (pos < end) {
                        var s = decodeBER(d, pos);
                        sub.push(s);
                        pos += s.header.length + s.content.length;
                    }
                    if (pos !== end)
                        throw new (root.DataError || Error)('Content size is not correct for container starting at offset ' + start);
                } else {
                    // undefined length
                    try {
                        for (; ; ) {
                            var s = decodeBER(d, pos);
                            pos += s.header.length + s.content.length;
                            if (s.tagClass === 0x00 && s.tagNumber === 0x00)
                                break;
                            sub.push(s);
                        }
                        len = pos - start;
                    } catch (e) {
                        throw new (root.DataError || Error)('Exception ' + e + ' while decoding undefined length content at offset ' + start);
                    }
                }
            }
            var value = new String(''),
                    header = new Uint8Array(d.buffer, offset, start - offset),
                    content = new Uint8Array(d.buffer, start, len);
            if (sub === null) {
                if (len === null)
                    throw new (root.DataError || Error)('Invalid tag with undefined length at offset ' + start);

                if (tagClass === 0) {
                    switch (tagNumber) {
                        case 0x01: // BOOLEAN
                            value = new Boolean(d[start] !== 0);
                            break;
                        case 0x02: // INTEGER
                        case 0x0a: // ENUMIRATED
                            if (len > 6) {
                                value = new String(gostCoding.Int16.encode(content));
                            } else {
                                var v = content[0];
                                if (content[0] > 0x7f)
                                    v = v - 256;
                                for (var i = 1; i < len; i++)
                                    v = v * 256 + content[i];
                                value = new Number(v);
                            }
                            break;
                        case 0x03: // BIT_STRING
                            if (len > 5) { // Content buffer
                                value = new Uint8Array(content.subarray(1)).buffer;
                            } else { // Max bit mask only for 32 bit
                                var unusedBit = content[0],
                                        skip = unusedBit, s = [];
                                for (var i = len - 1; i >= 1; --i) {
                                    var b = content[i];
                                    for (var j = skip; j < 8; ++j)
                                        s.push((b >> j) & 1 ? '1' : '0');
                                    skip = 0;
                                }
                                value = new String(s.reverse().join(''));
                            }
                            break;
                        case 0x04: // OCTET_STRING
                            value = new Uint8Array(content).buffer; // new String(gostCoding.Hex.encode(content));
                            break;
                            //  case 0x05: // NULL
                        case 0x06: // OBJECT_IDENTIFIER
                            var s = '',
                                    n = 0,
                                    bits = 0;
                            for (var i = 0; i < len; ++i) {
                                var v = content[i];
                                n = (n << 7) + (v & 0x7F);
                                bits += 7;
                                if (!(v & 0x80)) { // finished
                                    if (s === '') {
                                        var m = n < 80 ? n < 40 ? 0 : 1 : 2;
                                        s = m + "." + (n - m * 40);
                                    } else
                                        s += "." + n.toString();
                                    n = 0;
                                    bits = 0;
                                }
                            }
                            if (bits > 0)
                                throw new (root.DataError || Error)('Incompleted OID at offset ' + start);
                            value = new String(s);
                            break;
                            //case 0x07: // ObjectDescriptor
                            //case 0x08: // EXTERNAL
                            //case 0x09: // REAL
                            //case 0x0A: // ENUMERATED
                            //case 0x0B: // EMBEDDED_PDV
                        case 0x10: // SEQUENCE
                        case 0x11: // SET
                            value = new Array();
                            break;
                        case 0x0C: // UTF8String
                            value = new String(gostCoding.Chars.encode(content, 'utf8'));
                            break;
                        case 0x12: // NumericString
                        case 0x13: // PrintableString
                        case 0x14: // TeletexString
                        case 0x15: // VideotexString
                        case 0x16: // IA5String
                        case 0x19: // GraphicString
                        case 0x1A: // VisibleString
                        case 0x1B: // GeneralString
                            value = new String(gostCoding.Chars.encode(content, 'ascii'));
                            break;
                        case 0x1C: // UniversalString
                            value = new String(gostCoding.Chars.encode(content, 'utf32'));
                            break;
                        case 0x1E: // BMPString
                            value = new String(gostCoding.Chars.encode(content, 'utf16'));
                            break;
                        case 0x17: // UTCTime
                        case 0x18: // GeneralizedTime
                            var shortYear = tagNumber === 0x17;
                            var s = gostCoding.Chars.encode(content, 'ascii'),
                                    m = (shortYear ?
                                            /^(\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/ :
                                            /^(\d\d\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/).exec(s);
                            if (!m)
                                throw new (root.DataError || Error)('Unrecognized time format "' + s + '" at offset ' + start);
                            if (shortYear) {
                                // to avoid querying the timer, use the fixed range [1970, 2069]
                                // it will conform with ITU X.400 [-10, +40] sliding window until 2030
                                m[1] = +m[1];
                                m[1] += (m[1] < 70) ? 2000 : 1900;
                            }
                            var dt = new Date(m[1], +m[2] - 1, +m[3], +(m[4] || '0'), +(m[5] || '0'), +(m[6] || '0'), +(m[7] || '0')),
                                    tz = dt.getTimezoneOffset();
                            if (m[8] || tagNumber === 0x17) {
                                if (m[8].toUpperCase() !== 'Z' && m[9]) {
                                    tz = tz + parseInt(m[9]);
                                }
                                dt.setMinutes(dt.getMinutes() - tz);
                            }
                            value = dt;
                            break;
                    }
                } else // OCTET_STRING
                    value = new Uint8Array(content).buffer; // new String(gostCoding.Hex.encode(content));
            } else
                value = sub;

            // type name
            var typeName = tagClass === 1 ? 'Application_' + tagNumber :
                    tagClass === 2 ? '[' + tagNumber.toString() + ']' : // Context
                    tagClass === 3 ? 'Private_' + tagNumber :
                    BERtypes[tagNumber] || "Universal_" + tagNumber.toString();

            // result
            value.tagConstructed = constructed;
            value.tagClass = tagClass;
            value.tagNumber = tagNumber;
            value.header = header;
            value.content = content;
            value.typeName = typeName;
            return value;
        }

        return {
            /**
             * BER.decode(object, format) convert javascript object to ASN.1 format ArrayBuffer<br><br>
             * If object has members tagNumber, tagClass and tagConstructed
             * it is clear define encoding rules. Else method use defaul rules:
             * <ul>
             *   <li>Empty string or null - NULL</li>
             *   <li>String starts with '0x' and has 0-9 and a-f characters - INTEGER</li>
             *   <li>String like d.d.d.d (d - set of digits) - OBJECT IDENTIFIER</li>
             *   <li>String with characters 0 and 1 - BIT STRING</li>
             *   <li>Strings 'true' or 'false' - BOOLEAN</li>
             *   <li>String has only 0-9 and a-f characters - OCTET STRING</li>
             *   <li>String has only characters with code 0-255 - PrintableString</li>
             *   <li>Other strings - UTF8String</li>
             *   <li>Number - INTEGER</li>
             *   <li>Date - GeneralizedTime</li>
             *   <li>Boolean - SEQUENCE</li>
             *   <li>ArrayBuffer or TypedArray - OCTET STRING</li>
             * </ul>
             * SEQUENCE or SET arrays recursively encoded for each item.<br>
             * OCTET STRING and BIT STRING can presents as array with one item. 
             * It means encapsulates encoding for child element.<br>
             * 
             * If CONTEXT or APPLICATION classes item presents as array with one 
             * item we use EXPLICIT encoding for element, else IMPLICIT encoding.<br>
             * 
             * @memberOf gostCoding.BER
             * @param {Object} object Object to encoding
             * @param {string} format Encoding rule: 'DER' or 'CER', default 'DER'
             * @returns {ArrayBuffer} BER encoded data
             */
            encode: function(object, format) {
                return encodeBER(object, format).buffer;
            },
            /**
             * BER.encode(data) convert ASN.1 format ArrayBuffer data to javascript object<br><br>
             * 
             * Conversion rules to javascript object:
             *  <ul>
             *      <li>BOOLEAN - Boolean object</li>
             *      <li>INTEGER, ENUMIRATED - Integer object if len <= 6 (48 bits) else Int16 encoded string</li>
             *      <li>BIT STRING - Integer object if len <= 5 (w/o unsedBit octet - 32 bits) else String like '10111100' or  Array with one item in case of incapsulates encoding</li>
             *      <li>OCTET STRING - Hex encoded string or Array with one item in case of incapsulates encoding</li>
             *      <li>OBJECT IDENTIFIER - String with object identifier</li>
             *      <li>SEQUENCE, SET - Array of encoded items</li>
             *      <li>UTF8String, NumericString, PrintableString, TeletexString, VideotexString, 
             *          IA5String, GraphicString, VisibleString, GeneralString, UniversalString,
             *          BMPString - encoded String</li>
             *      <li>UTCTime, GeneralizedTime - Date</li>
             *  </ul>
             * @memberOf gostCoding.BER
             * @param {(ArrayBuffer|TypedArray)} data Binary data to decode
             * @returns {Object} Javascript object with result of decoding
             */
            decode: function(data) {
                return decodeBER(new Uint8Array(buffer(data)), 0);
            }
        }; // </editor-fold>
    })();

    /**
     * PEM conversion
     * 
     * @class gostCoding.PEM
     */
    gostCoding.PEM = {// <editor-fold defaultstate="collapsed">
        /**
         * PEM.encode(data, name) encode ArrayObject data to PEM format with name label
         * 
         * @memberOf gostCoding.PEM
         * @param {(Object|ArrayBuffer)} data Java script object or BER-encoded binary data
         * @param {string} name Name of PEM object: 'certificate', 'private key' etc.
         * @returns {string} Encoded object
         */
        encode: function(data, name) {
            return (name ? '-----BEGIN ' + name.toUpperCase() + '-----\r\n' : '') +
                    gostCoding.Base64.encode(data instanceof ArrayBuffer ? data : gostCoding.BER.encode(data)) +
                    (name ? '\r\n-----END ' + name.toUpperCase() + '-----' : '');
        },
        /**
         * PEM.decode(s, name, deep) decode PEM format s labeled name to ArrayBuffer or javascript object in according to deep parameter
         * 
         * @memberOf gostCoding.PEM
         * @param {string} s PEM encoded string
         * @param {string} name Name of PEM object: 'certificate', 'private key' etc.
         * @param {boolea} deep If true method do BER-decoding, else only BASE64 decoding
         * @returns {(Object|ArrayBuffer)} Decoded javascript object if deep=true, else ArrayBuffer for father BER decoding
         */
        decode: function(s, name, deep) {
            // Try clear base64
            var re1 = /([A-Za-z0-9\+\/\s\=]+)/g,
                    valid = re1.exec(s);
            if (valid[1].length !== s.length)
                valid = false;
            if (!valid && name) {
                // Try with the name
                var re2 = new RegExp(
                        '-----\\s?BEGIN ' + name.toUpperCase() +
                        '-----([A-Za-z0-9\\+\\/\\s\\=]+)-----\\s?END ' +
                        name.toUpperCase() + '-----', 'g');
                valid = re2.exec(s);
            }
            if (!valid) {
                // Try with some name
                var re3 = new RegExp(
                                '-----\\s?BEGIN [A-Z0-9\\s]+' +
                                '-----([A-Za-z0-9\\+\\/\\s\\=]+)-----\\s?END ' +
                                '[A-Z0-9\\s]+-----', 'g');
                valid = re3.exec(s);
            }
            if (valid) 
                s = valid[1];
            else
                throw new (root.DataError || Error)('Not valid PEM format');
            var out = gostCoding.Base64.decode(s);
            if (deep)
                out = gostCoding.BER.decode(out);
            return out;
        } // </editor-fold>
    };

    return gostCoding;

}));
