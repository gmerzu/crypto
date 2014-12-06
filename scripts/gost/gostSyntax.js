/**
 * @file PKCS message syntax and converters
 * @version 0.99
 * @copyright 2014, Rudolf Nickolaev. All rights reserved.
 */

/*
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this 
 *    list of conditions and the following disclaimer.
 *    
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *    
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
        define(['gostObject', 'gostCoding'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('gostObject'), require('gostCoding'));
    } else {
        root.gostSyntax = factory(root.gostObject, root.gostCoding);
    }
    // </editor-fold>

}(this, function(gostObject, gostCoding) {

    /*
     * Service functions
     * 
     */ // <editor-fold defaultstate="collapsed">

    var root = this;

    var DataError = root.DataError || Error,
            NotSupportedError = root.NotSupportedError || Error;


    function getAlgorithm(name) {
        return (gostObject || (gostObject = root.gostObject)).algorithms[name];
    }

    function getName(oid) {
        return (gostObject || (gostObject = root.gostObject)).names[oid];
    }

    function getIdentifier(name) {
        return (gostObject || (gostObject = root.gostObject)).identifiers[name];
    }

    function getAttributes(type) {
        return (gostObject || (gostObject = root.gostObject)).attributes[type];
    }

    function getParameters(type) {
        return (gostObject || (gostObject = root.gostObject)).parameters[type];
    }

    // BER coding
    function getBER() {
        return (gostCoding || (gostCoding = root.gostCoding)).BER;
    }

    // PEM coding
    function getPEM() {
        return (gostCoding || (gostCoding = root.gostCoding)).PEM;
    }

    // Hex coding;
    function getHex() {
        return (gostCoding || (gostCoding = root.gostCoding)).Hex;
    }

    // Hex coding;
    function getInt16() {
        return (gostCoding || (gostCoding = root.gostCoding)).Int16;
    }

    // Expand javascript object
    function expand() {
        var r = {};
        for (var i = 0, n = arguments.length; i < n; i++) {
            var item = arguments[i];
            if (typeof item === 'object')
                for (var name in item)
                    r[name] = item[name];
        }
        return r;
    }

    // swap bytes in buffer
    function swapBytes(src) {
        if (src instanceof ArrayBuffer)
            src = new Uint8Array(src);
        var dst = new Uint8Array(src.length);
        for (var i = 0, n = src.length; i < n; i++)
            dst[n - i - 1] = src[i];
        return dst.buffer;
    }

    // Get separate buffer for ASN.1 decoded value
    function block(value) {
        return value.buffer ? value.buffer :
                new Uint8Array(new Uint8Array(value.header.buffer, value.header.byteOffset,
                        value.header.byteLength + value.content.byteLength)).buffer;
    } // </editor-fold>

    /*
     * Base ASN.1 types and definitions
     * 
     */ // <editor-fold defaultstate="collapsed">

    // Ensure correct encode\decode ASN.1 values
    function encode(s, tagNumber, tagClass, tagConstructed) {
        var d;
        // Clone value define from redefine original
        if (typeof s === 'undefined')
            throw new DataError('Invalid value');
        if (s === null)
            d = new String('');
        else if (typeof s === 'string' || s instanceof String)
            d = new String(s.toString());
        else if (typeof s === 'number' || s instanceof Number)
            d = new Number(s.toString());
        else if (typeof s === 'boolean' || s instanceof Boolean)
            d = new Boolean(s ? true : false);
        else if (s instanceof Array)
            d = s.slice(0);
        else if (s instanceof Date)
            d = new Date(s.getTime());
        else if (s instanceof ArrayBuffer)
            d = new Uint8Array(new Uint8Array(s)).buffer;
        else if (s.buffer instanceof ArrayBuffer)
            d = new Uint8Array(new Uint8Array(s.buffer, s.byteOffset, s.byteLength)).buffer;
        // ASN.1 tag
        d.tagNumber = typeof tagNumber !== 'undefined' ? tagNumber : 0x05;
        d.tagClass = typeof tagClass !== 'undefined' ? tagClass : 0x00;
        d.tagConstructed = typeof tagConstructed !== 'undefined' ? tagConstructed : false;
        return d;
    }

    function decode(s, tagNumber, tagClass, tagConstructed) {
        if (typeof s === 'undefined')
            throw new DataError('Invalid value');
        tagClass = typeof tagClass !== 'undefined' ? tagClass : 0x00;
        tagConstructed = typeof tagConstructed !== 'undefined' ? tagConstructed : false;
        if (s.tagClass !== undefined && // Exclude implicit context
                ((tagNumber !== s.tagNumber && // Single tagNumber value
                        !((tagNumber instanceof Array) && tagNumber.indexOf(s.tagNumber) >= 0)) || // Set of tag number value
                        tagClass !== s.tagClass || tagConstructed !== s.tagConstructed)) // Not valid class or constructed flag
            throw new DataError('Invalid format');
        // Clone value define from redefine original
        var d = s;
        if (tagClass === 0x00 && tagNumber === 0x05)
            d = null;
        else if (s instanceof String)
            d = s.toString();
        else if (s instanceof Number)
            d = parseFloat(s);
        else if (s instanceof Boolean)
            if (s)
                d = true;
            else
                d = false;
        else if (s instanceof Array) {
            d = s.slice(0);
            d.buffer = block(s);
        } else if (s instanceof Date)
            d = new Date(s.getTime());
        else if (s instanceof ArrayBuffer)
            d = new Uint8Array(new Uint8Array(s)).buffer;
        else if (s.buffer instanceof ArrayBuffer)
            d = new Uint8Array(new Uint8Array(s.buffer, s.byteOffset, s.byteLength)).buffer;
        return d;
    }

    /**
     * Base ASN.1 types
     * @mixin
     * @class gostSyntax.PRIMITIVE
     * @private
     * @param {number} tagNumber
     */
    var PRIMITIVE = function(tagNumber) {
        return {
            /**
             * Encode value
             * @memberOf gostSyntax.PRIMITIVE
             * @param {Object} value
             * @returns {Object}
             */
            encode: function(value) {
                return encode(value, tagNumber);
            },
            /**
             * Decode value
             * @memberOf gostSyntax.PRIMITIVE
             * @param {Object} value
             * @returns {Object}
             */
            decode: function(value) {
                return decode(value, tagNumber);
            }
        };
    };

    var BOOLEAN = PRIMITIVE(0x01);

    var IA5String = PRIMITIVE(0x16);

    var PrintableString = PRIMITIVE(0x13);

    var TeletexString = PRIMITIVE(0x14);

    var UTF8String = PRIMITIVE(0x0c);

    var UTCTime = PRIMITIVE(0x17);

    var GeneralizedTime = PRIMITIVE(0x18);

    var UniversalString = PRIMITIVE(0x1C);

    var BMPString = PRIMITIVE(0x1e);

    var NULL = {
        encode: function() {
            return encode(null, 0x05);
        },
        decode: function(value) {
            return decode(value, 0x05);
        }
    };

    var PRIMITIVE_SUBST = function(tagNumber) {
        var BASE = PRIMITIVE(tagNumber);
        var f = function(struct) {
            return {
                encode: function(value) {
                    var d = struct[value];
                    if (typeof d === 'undefined')
                        throw new DataError('Invalid value');
                    return BASE.encode(d);
                },
                decode: function(value) {
                    value = BASE.decode(value);
                    for (var name in struct) {
                        if (value === struct[name])
                            return name;
                    }
                }
            };
        };
        f.encode = BASE.encode;
        f.decode = BASE.decode;
        return f;
    };

    var INTEGER = PRIMITIVE_SUBST(0x02);

    var ENUMERATED = PRIMITIVE_SUBST(0x0a);

    var ARRAY_OF_BYTE = function(tagNumber, define) {
        var f = function(type) {
            if (define && define.call)
                type = define(type);
            return {
                encode: function(value) {
                    if (type)
                        value = type.encode(value);
                    return encode(value, tagNumber);
                },
                decode: function(value) {
                    var result = decode(value, tagNumber);
                    if (type)
                        result = type.decode(result);
                    return result;
                }
            };
        };
        f.encode = function(value) {
            return encode(value, tagNumber);
        };
        f.decode = function(value) {
            return decode(value, tagNumber);
        };
        return f;
    };

    var OCTET_STRING = ARRAY_OF_BYTE(0x04);

    var BIT_STRING = ARRAY_OF_BYTE(0x03, function(type) {
        if (!type || (type.encode && type.decode)) // already type
            return type;
        else { // Mask type
            var mask = [];
            for (var name in type)
                mask[type[name]] = name;
            return {
                encode: function(value) {
                    if (value instanceof Array) {
                        var s = '';
                        for (var i = 0; i < mask.length; i++) {
                            if (mask[i] && value.indexOf(mask[i]) >= 0)
                                s += '1';
                            else
                                s += '0';
                        }
                        while (s.length > 1 && s.charAt(s.length - 1) === '0')
                            s = s.substring(0, s.length - 1);
                    } else
                        s = '0';
                    return s;
                },
                decode: function(value) {
                    var obj = [];
                    for (var i = 0; i < value.length; i++)
                        if (value.charAt(i) === '1' && mask[i])
                            obj.push(mask[i]);
                    return obj;

                }
            };
        }
    });

    /**
     * SEQUENCE syntax
     * @class gostSyntax.SEQUENCE
     * @private
     * @mixin
     * @param {Object} struct
     */
    var SEQUENCE = function(struct) {
        return {
            /**
             * Encode SEQUENCE value
             * @memberOf gostSyntax.SEQUENCE
             * @param {Object} value
             * @returns {Object}
             */
            encode: function(value) {
                var result = [];
                for (var name in struct) {
                    // console.log('name: \'' + name + '\', value: ', value[name]);
                    var item = struct[name].encode(value[name]);
                    if (item !== undefined)
                        result.push(item);
                }
                return encode(result, 0x10, 0, true);
            },
            /**
             * Decode SEQUENCE value
             * @memberOf gostSyntax.SEQUENCE
             * @param {Object} value
             * @returns {Object}
             */
            decode: function(value) {
                value = decode(value, 0x10, 0, true);
                var result = {}, i = 0;
                for (var name in struct) {
                    // console.log('name: \'' + name + '\', value: ', value[i]);
                    var r = struct[name].decode(value[i]);
                    if (r !== undefined) {
                        result[name] = r;
                        i++;
                    }
                }
                result.buffer = value.buffer;
                return result;
            }
        };
    };

    var OBJECT_IDENTIFIER = {
        encode: function(value) {
            var s;
            if (/^(\d+\.)+\d+$/.test(value))
                s = value;
            else {
                s = getIdentifier(value);
                if (!s)
                    throw new DataError('Invalid object identifier value');
            }
            return encode(s, 0x06);
        },
        decode: function(value) {
            var s = decode(value, 0x06);
            return getName(s) || s;
        }
    };

    var CTX = function(number, type) {
        return {
            encode: function(value) {
                value = type.encode(value);
                return encode(value, number, 0x02, value instanceof Array);
            },
            decode: function(value) {
                return type.decode(decode(value, number, 0x02, value instanceof Array));
            }
        };
    };

    var ARRAY_OF = function(tagNumber) {

        return function(type, getter, setter) {
            type = type || ANY;
            var f = function(typeSet, mask) {
                var baseType = type.call ? type(typeSet) : type;
                return {
                    encode: function(value) {
                        var result = [];
                        if (getter)
                            for (var id in value) {
                                if (id !== 'buffer')
                                    result.push(baseType.encode(getter(id, value[id], mask)));
                            }
                        else
                            for (var i = 0, n = value.length; i < n; i++)
                                result.push(baseType.encode(value[i]));
                        return encode(result, tagNumber, 0, true);
                    },
                    decode: function(value) {
                        var result = setter ? {} : [];
                        value = decode(value, tagNumber, 0, true);
                        if (setter)
                            for (var i = 0; i < value.length; i++)
                                setter(result, baseType.decode(value[i]));
                        else
                            for (var i = 0, n = value.length; i < n; i++)
                                result.push(baseType.decode(value[i]));
                        result.buffer = value.buffer;
                        return result;
                    }
                };
            };
            f.encode = function(value) {
                var result = [];
                for (var i = 0, n = value.length; i < n; i++)
                    result.push(type.encode(value[i]));
                return encode(result, tagNumber, 0, true);
            };
            f.decode = function(value) {
                value = decode(value, tagNumber, 0, true);
                var result = [];
                for (var i = 0, n = value.length; i < n; i++)
                    result.push(type.decode(value[i]));
                result.buffer = value.buffer;
                return result;
            };
            return f;

        };
    };

    var SEQUENCE_OF = ARRAY_OF(0x10);

    var SET_OF = ARRAY_OF(0x11);

    var SET_OF_SINGLE = function(type) {
        return {
            encode: function(value) {
                return encode([type.encode(value)], 0x11, 0, true);
            },
            decode: function(value) {
                value = decode(value, 0x11, 0, true);
                return type.decode(value[0]);
            }
        };
    };

    /**
     * CHOICE syntax
     * @class gostSyntax.CHOICE
     * @private
     * @mixin
     * @param {Object} struct
     * @param {function} define
     */
    var CHOICE = function(struct, define) {
        if (struct instanceof Array) {
            return {
                /**
                 * Encode CHOICE value
                 * @memberOf gostSyntax.CHOICE
                 * @param {Object} value
                 * @returns {Object}
                 */
                encode: function(value) {
                    if (define)
                        return define(value).encode(value);
                    else
                        for (var i = 0; i < struct.length; i++) {
                            try {
                                var s = struct[i].encode(value);
                                if (s !== undefined)
                                    return s;
                            } catch (e) {
                            }
                        }
                    throw new DataError('Invalid format');
                },
                /**
                 * Decode CHOICE value
                 * @memberOf gostSyntax.CHOICE
                 * @param {Object} value
                 * @returns {Object}
                 */
                decode: function(value) {
                    for (var i = 0; i < struct.length; i++) {
                        try {
                            var r = struct[i].decode(value);
                            if (r !== undefined)
                                return r;
                        } catch (e) {
                        }
                    }
                    throw new DataError('Invalid format');
                }
            };
        } else {
            return {
                encode: function(value) {
                    for (var name in struct) {
                        // console.log('name: \'' + name + '\', value: ', value[name]);
                        var s = value[name];
                        if (s !== undefined)
                            return struct[name].encode(s);
                    }
                    throw new DataError('Invalid format');
                },
                decode: function(value) {
                    var result = {};
                    for (var name in struct) {
                        try {
                            // console.log('name: \'' + name + '\', value: ', value);
                            var r = struct[name].decode(value);
                            if (r !== undefined) {
                                result[name] = r;
                                return result;
                            }
                        } catch (e) {
                        }
                    }
                    throw new DataError('Invalid format');
                }
            };

        }
    };

    var ENCAPSULATES = (function() {
        var f = function(type) {
            return {
                encode: function(value) {
                    value = type.encode(value);
                    return getBER().encode(value);
                },
                decode: function(value) {
                    var result = getBER().decode(value);
                    return type.decode(result);
                }
            };
        };
        f.encode = function(value) {
            return getBER().encode(value);
        };
        f.decode = function(value) {
            return getBER().decode(value);
        };
        return f;
    })();

    var IMPLICIT = function(type) {
        return {
            encode: function(value) {
                return type.encode(value);
            },
            decode: function(value) {
                return type.decode(value);
            }
        };
    };

    var EXPLICIT = function(type) {
        return {
            encode: function(value) {
                return [type.encode(value)];
            },
            decode: function(value) {
                return type.decode(value[0]);
            }
        };
    };

    var ANY = {
        encode: function(value) {
            return value;
        },
        decode: function(value) {
            return value;
        }
    };

    var DEFAULT = function(type, opt) {
        return {
            encode: function(value) {
                if (value === opt || value === undefined)
                    return undefined;
                return type.encode(value);
            },
            decode: function(value) {
                if (value === undefined) {
                    return opt;
                }
                try {
                    return type.decode(value);
                } catch (e) {
                    return undefined;
                }
            }
        };
    };

    var OPTIONAL = function(type) {
        return {
            encode: function(value) {
                if (value === undefined)
                    return undefined;
                return type.encode(value);
            },
            decode: function(value) {
                if (value === undefined) {
                    return undefined;
                }
                try {
                    return type.decode(value);
                } catch (e) {
                    return undefined;
                }
            }
        };
    };

    var DEFAULT_NULL = function(type, opt) {
        return {
            encode: function(value) {
                if (value === opt || value === undefined)
                    return NULL.encode(null);
                return type.encode(value);
            },
            decode: function(value) {
                if (value === undefined) {
                    return undefined;
                } else if (value === null) {
                    return opt;
                }
                return type.decode(value);
            }
        };
    };

    var IDENTIFIED_BY = function(base, identifier, ownerDafault) {
        ownerDafault = ownerDafault || ANY;
        var f = function(typeSet, typeDefault) {
            typeSet = typeSet || {};
            typeDefault = typeDefault || ownerDafault;
            var define = function(id) {
                var type;
                if (typeSet) {
                    if (typeSet.call)
                        type = typeSet(id);
                    else
                        type = typeSet[id];
                }
                return type || typeDefault;
            };
            return {
                encode: function(value) {
                    var type = define(identifier.encode(value));
                    return base(type).encode(value);
                },
                decode: function(value) {
                    var type = define(identifier.decode(value));
                    return base(type).decode(value);
                }
            };
        };
        f.encode = function(value) {
            return base(ownerDafault).encode(value);
        };
        f.decode = function(value) {
            return base(ownerDafault).decode(value);
        };
        return f;
    };

    var ATTRIBUTE = function(struct, id, idType, ownerDafault) {
        id = id || 'type';
        idType = idType || OBJECT_IDENTIFIER;
        var base = function(type) {
            return SEQUENCE(struct(type));
        };
        return IDENTIFIED_BY(base, {
            encode: function(value) {
                return value[id];
            },
            decode: function(value) {
                return idType.decode(value[0]);
            }
        }, ownerDafault);
    };
    // </editor-fold>    

    /*
     * Certificate Version, Name, Attributes, Validity
     * 
     * http://tools.ietf.org/html/rfc5280
     * 
     */ // <editor-fold defaultstate="collapsed">

    var DirectoryString = CHOICE([UTF8String, PrintableString, TeletexString, UniversalString, BMPString], function(value) {
        // PrintableString - for characters and symbols with no spaces, overrise UTF8String
        return /^[A-Za-z0-9\.@\+\-\:\=\\\/\?\!\#\$\%\^\&\*\(\)\[\]\{\}\>\<\|\~]*$/.test(value) ? PrintableString : UTF8String;
    });

    var Time = CHOICE([GeneralizedTime, UTCTime], function(value) {
        return value.getYear() >= 2050 ? GeneralizedTime : UTCTime;
    });

    // Attribute
    var AttributeType = OBJECT_IDENTIFIER;

    var AttributeValue = ANY;

    var AttributeTypeAndValue = ATTRIBUTE(function(type) {
        return {
            type: AttributeType,
            value: type
        };
    }, 'type', AttributeType, AttributeValue);

    /**
     * X.501 type Name
     * The Name describes a hierarchical name composed of attributes, such
     * as country name, and corresponding values, such as US.  The type of
     * the component AttributeValue is determined by the AttributeType; in
     * general it will be a DirectoryString.
     
     * The DirectoryString type is defined as a choice of PrintableString,
     * TeletexString, BMPString, UTF8String, and UniversalString.  The
     * UTF8String encoding [RFC 2279] is the preferred encoding, and all
     * certificates issued after December 31, 2003 MUST use the UTF8String
     * encoding of DirectoryString.
     * 
     * Standard sets of attributes have been defined in the X.500 series of
     * specifications [X.520].  Implementations of this specification MUST
     * be prepared to receive the following standard attribute types in
     * issuer and subject (section 4.1.2.6) names:
     *  <ul>
     *      <li>country,</li>
     *      <li>organization,</li>
     *      <li>organizational-unit,</li>
     *      <li>distinguished name qualifier,</li>
     *      <li>state or province name,</li>
     *      <li>common name (e.g., "Susan Housley"), and</li>
     *      <li>serial number.</li>
     *  </ul>
     * In addition, implementations of this specification SHOULD be prepared
     * to receive the following standard attribute types in issuer and
     * subject names:
     *  <ul>
     *      <li>locality,</li>
     *      <li>title,</li>
     *      <li>surname,</li>
     *      <li>given name,</li>
     *      <li>initials,</li>
     *      <li>pseudonym, and</li>
     *      <li>generation qualifier (e.g., "Jr.", "3rd", or "IV").</li>
     *  </ul>
     The syntax for type Name:
     *  <pre>
     *  Name ::= CHOICE {
     *    RDNSequence }
     *
     *  RDNSequence ::= SEQUENCE OF RelativeDistinguishedName
     *
     *  RelativeDistinguishedName ::=
     *    SET OF AttributeTypeAndValue
     *
     *  AttributeTypeAndValue ::= SEQUENCE {
     *    type     AttributeType,
     *    value    AttributeValue }
     *
     *  AttributeType ::= OBJECT IDENTIFIER
     *
     *  AttributeValue ::= ANY DEFINED BY AttributeType
     *
     *  DirectoryString ::= CHOICE {
     *        teletexString           TeletexString (SIZE (1..MAX)),
     *        printableString         PrintableString (SIZE (1..MAX)),
     *        universalString         UniversalString (SIZE (1..MAX)),
     *        utf8String              UTF8String (SIZE (1..MAX)),
     *        bmpString               BMPString (SIZE (1..MAX)) }
     *  </pre>
     * @class Name
     */
    var RelativeDistinguishedName = SET_OF_SINGLE(AttributeTypeAndValue({
        emailAddress: IA5String,
        domainComponent: IA5String
    }, DirectoryString));

    var RDNSequence = SEQUENCE_OF(RelativeDistinguishedName, function(id, value) {
        return {
            type: id,
            value: value
        };
    }, function(result, data) {
        result[data.type] = data.value;
    })();

    var Name = CHOICE([RDNSequence]);

    /**
     * Canonical name<br>
     * Class encode/decode canonical string name like 
     * <pre>
     *  'CN=www.google.com,C=US,O=Google Inc.' 
     * </pre>
     * tojavascript object like 
     * <pre>
     *  {
     *      commonName: 'www.google.com',
     *      countryName: 'US',
     *      organizationName: 'Google Inc.'
     *  }
     * </pre>
     * 
     * @class gostSyntax.CanocicalName
     */
    var CanocicalName = (function() {
        var aliases = {
            commonName: 'CN',
            serialName: 'SN',
            countryName: 'C',
            localityName: 'L',
            stateOrProvinceName: 'ST',
            streetAddress: 'STREET',
            organizationName: 'O',
            organizationalUnitName: 'OU',
            title: 'TITLE',
            name: 'NAME',
            givenName: 'GNAME',
            initials: 'INITIALS',
            distinguishedName: 'DN'
        };
        var names = [];
        for (var id in aliases)
            names[aliases[id]] = id;

        return {
            /**
             * CanocicalName.encode(name) - Encode Name to canonical name
             * @method encode
             * @memberOf gostSyntax.CanocicalName
             * @param {gostSyntax.Name} name
             * @returns {string}
             */
            encode: function(name) {
                var ar = [], s = [];
                for (var id in name) {
                    ar.push(id);
                }
                ar.sort(function(a, b) {
                    var ai = getIdentifier(a), bi = getIdentifier(b);
                    if (ai < bi) {
                        return -1;
                    } else if (ai > bi) {
                        return 1;
                    } else
                        return 0;
                });
                for (var i = 0, n = ar.length; i < n; i++)
                    s.push((aliases[id] || getIdentifier(id)) + '=' + name[id]);
                return s.join(',');
            },
            /**
             * CanocicalName.decode(canonical) - Decode canonical name to Name
             * @memberOf gostSyntax.CanocicalName
             * @param {string} canonical
             * @returns {gostSyntax.Name}
             */
            decode: function(canonical) {
                var result = {}, ar = canonical.split(',');
                for (var i = 0, n = ar.length; i < n; i++) {
                    var item = ar[i].split('='),
                            id = item[0].trim(), value = item[1].trim();
                    result[names[id] || getName(id)] = value;
                }
            }
        };
    });

    // Validity
    var Validity = SEQUENCE({
        notBefore: Time,
        notAfter: Time});

    var Version = INTEGER;

    // Attributes
    var Attribute = ATTRIBUTE(function(type) {
        return {
            type: OBJECT_IDENTIFIER,
            value: type
        };
    });

    var Attributes = SET_OF(Attribute, function(id, value) {
        return {
            type: id,
            value: value
        };
    }, function(result, data) {
        result[data.type] = data.value;
    });

    var AttributeSequence = SEQUENCE_OF(Attribute, function(id, value) {
        return {
            type: id,
            value: value
        };
    }, function(result, data) {
        result[data.type] = data.value;
    });
    // </editor-fold>    

    /*
     * Algorithm identifiers
     * 
     * http://tools.ietf.org/html/rfc3279
     * http://tools.ietf.org/html/rfc4357
     * http://tools.ietf.org/html/rfc2898
     * 
     */ // <editor-fold defaultstate="collapsed">

    var FieldElement = INTEGER;
    var Curve = SEQUENCE({
        a: FieldElement,
        b: FieldElement,
        seed: OPTIONAL(BIT_STRING)});

    var ECPoint = OCTET_STRING({
        encode: function(value) {
            return getHex().decode('04' +
                    value.x.replace('0x', '') +
                    value.y.replace('0x', ''));
        },
        decode: function(value) {
            var s = getHex().encode(value).replace(/[^A-fa-f0-9]/g, '').substring(2);
            return {
                x: '0x' + s.substring(0, s.length / 2),
                y: '0x' + s.substring(s.length / 2)
            };
        }});

    var FieldID = SEQUENCE({
        fieldType: OBJECT_IDENTIFIER,
        parameters: INTEGER});

    var ECParameters = SEQUENCE({
        version: Version, // version is always 1         
        fieldID: FieldID, // identifies the finite field over which the curve is defined 
        curve: Curve, // coefficients a and b of the elliptic curve         
        base: ECPoint, // specifies the base point P on the elliptic curve         
        order: INTEGER, // the order n of the base point         
        cofactor: OPTIONAL(INTEGER)}); // The integer h = #E(Fq)/n  

    var GostR3410Parameters = SEQUENCE({
        publicKeyParamSet: OBJECT_IDENTIFIER,
        digestParamSet: OBJECT_IDENTIFIER,
        encryptionParamSet: DEFAULT(OBJECT_IDENTIFIER, 'id-Gost28147-89-CryptoPro-A-ParamSet')});

    var GostR3411Parameters = DEFAULT_NULL(OBJECT_IDENTIFIER, 'id-GostR3411-94-CryptoProParamSet');

    var ECDHParameters = CHOICE({
        namedParameters: OBJECT_IDENTIFIER,
        ecParameters: ECParameters,
        implicitly: OPTIONAL(NULL)});

    var AlgorithmIdentifier = (function() {
        var Algorithm = function(paramType) {
            return SEQUENCE({
                algorithm: OBJECT_IDENTIFIER,
                parameters: OPTIONAL(paramType)});
        };

        var f = function(algorithms) {
            return {
                encode: function(value) {
                    var Type = algorithms[value.id];
                    if (Type)
                        return Algorithm(Type.paramType).encode(Type.encode(value));
                    else
                        throw new NotSupportedError('Algorithm not supported');
                },
                decode: function(value) {
                    var Type = algorithms[getName(value[0])];
                    if (Type)
                        return Type.decode(Algorithm(Type.paramType).decode(value));
                    else
                        throw new NotSupportedError('Algorithm not supported');
                }
            };
        };
        f.encode = function(value) {
            return Algorithm(ANY).encode(value);
        };
        f.decode = function(value) {
            return Algorithm(ANY).decode(value);
        };
        return f;
    })();

    var ECDHKeyAlgorithm = {
        paramType: ECDHParameters,
        encode: function(value) {
            var parameters;
            if (typeof value.namedCurve === 'string')
                parameters = {
                    namedParameters: getAttributes('namedCurve')[value.namedCurve]
                };
            else
                parameters = {
                    ecParameters: {
                        version: 1,
                        fieldID: {
                            fieldType: 'id-prime-Field',
                            parameters: value.p
                        },
                        curve: {
                            a: value.a,
                            b: value.b
                        },
                        base: {
                            x: value.x,
                            y: value.y
                        },
                        order: value.q,
                        cofactor: 1
                    }
                };
            return {
                algorithm: value.id,
                parameters: parameters
            };
        },
        decode: function(value) {
            var parameters = value.parameters,
                    result = getAlgorithm(value.algorithm);
            if (parameters.namedParameters) {
                result = expand(result, getParameters(parameters.namedParameters));
            } else if (parameters.ecParameters) {
                result = expand(result, {
                    p: parameters.ecParameters.fieldID.parameters,
                    a: parameters.ecParameters.curve.a,
                    b: parameters.ecParameters.curve.b,
                    x: parameters.ecParameters.base.x,
                    y: parameters.ecParameters.base.y,
                    q: parameters.ecParameters.order
                });
            } else
                throw new DataError('Invalid key paramters');
            return result;
        }
    };

    var GostKeyAlgorithm = {
        paramType: GostR3410Parameters,
        encode: function(value) {
            var paramName = value.namedCurve ? 'namedCurve' : 'namedParam',
                    sBox = (value.name.indexOf('-94') >= 0 || value.name.indexOf('-2001') >= 0 ||
                            value.version === 1994 || value.version === 2001) ? value.sBox || 'D-A' :
                    (value.name.indexOf('-512') >= 0 || value.length === 512) ? 'D-512' : 'D-256';
            return {
                algorithm: value.id,
                parameters: {
                    publicKeyParamSet: getAttributes(paramName)[value[paramName]],
                    digestParamSet: getAttributes('sBox')[sBox]
                }
            };
        },
        decode: function(value) {
            var parameters = value.parameters;
            return expand(getAlgorithm(value.algorithm),
                    getParameters(parameters.publicKeyParamSet),
                    getParameters(parameters.digestParamSet));
        }
    };

    var AlgorithmWithNoParam = {
        encode: function(value) {
            return {algorithm: value.id};
        },
        decode: function(value) {
            return getAlgorithm(value.algorithm);
        }
    };

    var AlgorithmWithNullParam = {
        paramType: NULL,
        encode: function(value) {
            return {
                algorithm: value.id,
                parameters: null
            };
        },
        decode: function(value) {
            return getAlgorithm(value.algorithm);
        }
    };

    var Gost341194DigestAlgorithm = {
        paramType: GostR3411Parameters,
        encode: function(value) {
            return {
                algorithm: value.id,
                parameters: getAttributes('sBox')[value.sBox || 'D-A']
            };
        },
        decode: function(value) {
            return expand(getAlgorithm(value.algorithm),
                    getParameters(value.parameters));
        }
    };

    var KeyAlgorithmIdentifier = AlgorithmIdentifier({
        ecdsa: ECDHKeyAlgorithm,
        rsaEncryption: AlgorithmWithNullParam,
        'id-sc-gostR3410-2001': ECDHKeyAlgorithm,
        'id-GostR3410-2001': GostKeyAlgorithm,
        'id-GostR3410-94': GostKeyAlgorithm,
        'id-tc26-gost3410-12-256': GostKeyAlgorithm,
        'id-tc26-gost3410-12-512': GostKeyAlgorithm
    });

    var SignatureAlgorithmIdentifier = AlgorithmIdentifier({
        noSignature: AlgorithmWithNullParam,
        rsaEncryption: AlgorithmWithNullParam,
        sha1withRSAEncryption: AlgorithmWithNullParam,
        sha256withRSAEncryption: AlgorithmWithNullParam,
        sha384withRSAEncryption: AlgorithmWithNullParam,
        sha512withRSAEncryption: AlgorithmWithNullParam,
        'ecdsa': AlgorithmWithNoParam,
        'ecdsa-with-SHA1': AlgorithmWithNoParam,
        'ecdsa-with-SHA256': AlgorithmWithNoParam,
        'ecdsa-with-SHA384': AlgorithmWithNoParam,
        'ecdsa-with-SHA512': AlgorithmWithNoParam,
        'id-GostR3410-94': AlgorithmWithNullParam,
        'id-GostR3410-2001': AlgorithmWithNullParam,
        'id-GostR3411-94-with-GostR3410-2001': AlgorithmWithNoParam,
        'id-GostR3411-94-with-GostR3410-94': AlgorithmWithNoParam,
        'id-tc26-gost3410-12-256': AlgorithmWithNullParam,
        'id-tc26-gost3410-12-512': AlgorithmWithNullParam,
        'id-tc26-signwithdigest-gost3410-12-94': AlgorithmWithNoParam,
        'id-tc26-signwithdigest-gost3410-12-256': AlgorithmWithNoParam,
        'id-tc26-signwithdigest-gost3410-12-512': AlgorithmWithNoParam,
        'id-sc-gostR3410-94': AlgorithmWithNullParam,
        'id-sc-gostR3410-2001': AlgorithmWithNullParam,
        'id-sc-gostR3411-94-with-gostR3410-94': AlgorithmWithNullParam,
        'id-sc-gostR3411-94-with-gostR3410-2001': AlgorithmWithNullParam
    });

    var DigestAlgorithmIdentifier = AlgorithmIdentifier({
        sha1: AlgorithmWithNullParam,
        sha256: AlgorithmWithNullParam,
        sha384: AlgorithmWithNullParam,
        sha512: AlgorithmWithNullParam,
        'id-GostR3411-94': Gost341194DigestAlgorithm,
        'id-tc26-gost3411-94': Gost341194DigestAlgorithm,
        'id-tc26-gost3411-12-256': AlgorithmWithNullParam,
        'id-tc26-gost3411-12-512': AlgorithmWithNullParam,
        'id-sc-gostR3411-94': AlgorithmWithNoParam});

    var Gost2814789Key = OCTET_STRING; //(SIZE (32))

    var Gost2814789MAC = OCTET_STRING; // (SIZE (1..4))

    var Gost2814789ParamSet = OBJECT_IDENTIFIER;

    var Gost2814789IV = OCTET_STRING; // (SIZE (8))

    var Gost2814789Parameters = SEQUENCE({
        iv: Gost2814789IV,
        encryptionParamSet: Gost2814789ParamSet});

    var Gost2814789KeyWrapParameters = SEQUENCE({
        encryptionParamSet: Gost2814789ParamSet,
        ukm: OPTIONAL(OCTET_STRING)}); // (SIZE (8)) must be absent in key agreement

    var Gost2814789Algorithm = {
        paramType: Gost2814789Parameters,
        encode: function(value) {
            return {
                algorithm: value.id,
                parameters: {
                    iv: value.iv,
                    encryptionParamSet: getAttributes('sBox')[value.sBox || 'E-A']
                }
            };
        },
        decode: function(value) {
            var algorithm = expand(getAlgorithm(value.algorithm),
                    getParameters(value.parameters.encryptionParamSet));
            algorithm.iv = value.parameters.iv;
            return algorithm;
        }
    };

    var GostKeyWrapAlgorithm = {
        paramType: Gost2814789KeyWrapParameters,
        encode: function(value) {
            return {
                algorithm: value.id,
                parameters: {
                    encryptionParamSet: getAttributes('sBox')[value.sBox || 'E-A'],
                    ukm: value.ukm
                }
            };
        },
        decode: function(value) {
            var algorithm = expand(getAlgorithm(value.algorithm),
                    getParameters(value.parameters.encryptionParamSet));
            if (value.parameters.ukm)
                algorithm.ukm = value.parameters.ukm;
            return algorithm;
        }
    };

    var KeyWrapAlgorithmIdentifier = AlgorithmIdentifier({
        'id-Gost28147-89-None-KeyWrap': GostKeyWrapAlgorithm,
        'id-Gost28147-89-CryptoPro-KeyWrap': GostKeyWrapAlgorithm});

    var GostKeyAgreementAlgorithm = {
        paramType: KeyWrapAlgorithmIdentifier,
        encode: function(value) {
            return {
                algorithm: value.id,
                parameters: value.wrapping
            };
        },
        decode: function(value) {
            var algorithm = expand(getAlgorithm(value.algorithm));
            algorithm.wrapping = value.parameters;
            return algorithm;
        }
    };

    var KeyEncryptionAlgorithmIdentifier = AlgorithmIdentifier({
        ecdsa: ECDHKeyAlgorithm,
        rsaEncryption: AlgorithmWithNullParam,
        // Key transport algorithms
        'id-sc-gostR3410-2001': ECDHKeyAlgorithm,
        'id-GostR3410-2001': GostKeyAlgorithm,
        'id-GostR3410-94': GostKeyAlgorithm,
        'id-tc26-gost3410-12-256': GostKeyAlgorithm,
        'id-tc26-gost3410-12-512': GostKeyAlgorithm,
        // Key agreement algorithms
        'id-GostR3410-94-CryptoPro-ESDH': GostKeyAgreementAlgorithm,
        'id-GostR3410-2001-CryptoPro-ESDH': GostKeyAgreementAlgorithm,
        'id-tc26-agreement-gost-3410-12-256': GostKeyAgreementAlgorithm,
        'id-tc26-agreement-gost-3410-12-512': GostKeyAgreementAlgorithm,
        'id-sc-r3410-ESDH-r3411kdf': ECDHKeyAlgorithm,
        // Key encryption key algorithms
        'id-Gost28147-89-None-KeyWrap': GostKeyWrapAlgorithm, // Add ukm to algorithm
        'id-Gost28147-89-CryptoPro-KeyWrap': GostKeyWrapAlgorithm,
        'id-sc-cmsGostWrap': AlgorithmWithNoParam, // SC don't use ukm
        'id-sc-cmsGost28147Wrap': AlgorithmWithNoParam});

    var BaseEncryptionAlgorithmIdentifier = AlgorithmIdentifier({
        'id-sc-gost28147-gfb': AlgorithmWithNoParam,
        'id-Gost28147-89': Gost2814789Algorithm});

    var MessageAuthenticationCodeAlgorithm = AlgorithmIdentifier({
        'id-Gost28147-89-MAC': Gost2814789Parameters,
        'id-HMACGostR3411-94': AlgorithmWithNoParam,
        'id-tc26-hmac-gost-3411-12-256': AlgorithmWithNoParam,
        'id-tc26-hmac-gost-3411-12-512': AlgorithmWithNoParam,
        'hmacWithSHA1': AlgorithmWithNoParam,
        'hmacWithSHA224': AlgorithmWithNoParam,
        'hmacWithSHA256': AlgorithmWithNoParam,
        'hmacWithSHA384': AlgorithmWithNoParam,
        'hmacWithSHA512': AlgorithmWithNoParam,
        'id-sc-gost28147-mac': AlgorithmWithNoParam,
        'id-sc-hmacWithGostR3411': AlgorithmWithNoParam});

    // rfc2898 PKCS #5: Password-Based Cryptography Specification
    // PBKDF2
    var PBKDF2params = SEQUENCE({
        salt: CHOICE({
            specified: OCTET_STRING,
            otherSource: AlgorithmIdentifier
        }),
        iterationCount: INTEGER,
        keyLength: OPTIONAL(INTEGER),
        prf: MessageAuthenticationCodeAlgorithm});

    var PBKDF2Algorithm = {
        paramType: PBKDF2params,
        encode: function(value) {
            return {
                algorithm: value.id,
                parameters: {
                    salt: {specified: value.salt},
                    iterationCount: value.iterations,
                    prf: value.hmac
                }
            };
        },
        decode: function(value) {
            var algorithm = expand(getAlgorithm(value.algorithm));
            algorithm.salt = value.parameters.salt.specified;
            algorithm.iterations = value.parameters.iterationCount;
            algorithm.hmac = value.parameters.prf;
            return algorithm;
        }
    };

    var KeyDerivationAlgorithmIdentifier = AlgorithmIdentifier({
        'PBKDF2': PBKDF2Algorithm});

    var PBEParameter = SEQUENCE({
        salt: OCTET_STRING,
        iterationCount: INTEGER});

    var PBES1Algorithm = {
        paramType: PBEParameter,
        encode: function(value) {
            return {
                algorithm: value.id,
                parameters: {
                    salt: value.derivation.salt,
                    iterationCount: value.derivation.iterations
                }
            };
        },
        decode: function(value) {
            var algorithm = expand(getAlgorithm(value.algorithm));
            algorithm.derivation = expand(algorithm.derivation,
                    {salt: value.parameters.salt, iterations: value.parameters.iterationCount});
            return algorithm;
        }
    };

    // PBES2
    var PBES2params = SEQUENCE({
        keyDerivationFunc: KeyDerivationAlgorithmIdentifier, // {{PBES2-KDFs}},
        encryptionScheme: BaseEncryptionAlgorithmIdentifier}); // {{PBES2-Encs}}

    var PBES2Algorithm = {
        paramType: PBES2params,
        encode: function(value) {
            return {
                algorithm: value.id,
                parameters: {
                    keyDerivationFunc: value.derivation,
                    encryptionScheme: value.encryption
                }
            };
        },
        decode: function(value) {
            var algorithm = expand(getAlgorithm(value.algorithm));
            algorithm.derivation = value.parameters.keyDerivationFunc;
            algorithm.encryption = value.parameters.encryptionScheme;
            return algorithm;
        }
    };

    var PasswordEncryptionAlgorithmIndentifier = AlgorithmIdentifier({
        // PBES1
        'pbeWithSHAAndAES128-CBC': PBES1Algorithm,
        'pbeWithSHAAndAES192-CBC': PBES1Algorithm,
        'pbeWithSHAAndAES256-CBC': PBES1Algorithm,
        'pbeWithSHA256AndAES128-CBC': PBES1Algorithm,
        'pbeWithSHA256AndAES192-CBC': PBES1Algorithm,
        'pbeWithSHA256AndAES256-CBC': PBES1Algorithm,
        'id-sc-pbeWithGost3411AndGost28147': PBES1Algorithm,
        'id-sc-pbeWithGost3411AndGost28147CFB': PBES1Algorithm,
        // PBES2
        'PBES2': PBES2Algorithm});

    var PBMAC1params = SEQUENCE({
        keyDerivationFunc: KeyDerivationAlgorithmIdentifier, // {{PBMAC1-KDFs}},
        messageAuthScheme: MessageAuthenticationCodeAlgorithm}); // {{PBMAC1-MACs}}

    var PasswordMACAlgorithm = {
        paramType: PBMAC1params,
        encode: function(value) {
            return {
                algorithm: value.id,
                parameters: {
                    keyDerivationFunc: value.derivation,
                    messageAuthScheme: value.hmac}};
        },
        decode: function(value) {
            var algorithm = expand(getAlgorithm(value.algorithm));
            algorithm.derivation = value.parameters.keyDerivationFunc;
            algorithm.hmac = value.parameters.messageAuthScheme;
            return algorithm;
        }
    };

    var PasswordMACAlgorithmIdentifier = AlgorithmIdentifier({
        'PBMAC1': PasswordMACAlgorithm
    });

    var ContentEncryptionAlgorithmIdentifier = AlgorithmIdentifier({
        // Base encryption
        'id-sc-gost28147-gfb': AlgorithmWithNoParam,
        'id-Gost28147-89': Gost2814789Algorithm,
        // Password based encryption
        'pbeWithSHAAndAES128-CBC': PBES1Algorithm,
        'pbeWithSHAAndAES192-CBC': PBES1Algorithm,
        'pbeWithSHAAndAES256-CBC': PBES1Algorithm,
        'pbeWithSHA256AndAES128-CBC': PBES1Algorithm,
        'pbeWithSHA256AndAES192-CBC': PBES1Algorithm,
        'pbeWithSHA256AndAES256-CBC': PBES1Algorithm,
        'id-sc-pbeWithGost3411AndGost28147': PBES1Algorithm,
        'id-sc-pbeWithGost3411AndGost28147CFB': PBES1Algorithm,
        'PBES2': PBES2Algorithm
    });

    var KeyEncryptionAlgorithmIdentifier = AlgorithmIdentifier({
        ecdsa: ECDHKeyAlgorithm,
        rsaEncryption: AlgorithmWithNullParam,
        // Key transport algorithms
        'id-sc-gostR3410-2001': ECDHKeyAlgorithm,
        'id-GostR3410-2001': GostKeyAlgorithm,
        'id-GostR3410-94': GostKeyAlgorithm,
        'id-tc26-gost3410-12-256': GostKeyAlgorithm,
        'id-tc26-gost3410-12-512': GostKeyAlgorithm,
        // Key agreement algorithms
        'id-GostR3410-94-CryptoPro-ESDH': GostKeyAgreementAlgorithm,
        'id-GostR3410-2001-CryptoPro-ESDH': GostKeyAgreementAlgorithm,
        'id-tc26-agreement-gost-3410-12-256': GostKeyAgreementAlgorithm,
        'id-tc26-agreement-gost-3410-12-512': GostKeyAgreementAlgorithm,
        'id-sc-r3410-ESDH-r3411kdf': ECDHKeyAlgorithm,
        // Key encryption key algorithms
        'id-Gost28147-89-None-KeyWrap': GostKeyWrapAlgorithm, // Add ukm to algorithm
        'id-Gost28147-89-CryptoPro-KeyWrap': GostKeyWrapAlgorithm,
        'id-sc-cmsGostWrap': AlgorithmWithNoParam, // SC don't use ukm
        'id-sc-cmsGost28147Wrap': AlgorithmWithNoParam,
        // Password based encryption
        'pbeWithSHAAndAES128-CBC': PBES1Algorithm,
        'pbeWithSHAAndAES192-CBC': PBES1Algorithm,
        'pbeWithSHAAndAES256-CBC': PBES1Algorithm,
        'pbeWithSHA256AndAES128-CBC': PBES1Algorithm,
        'pbeWithSHA256AndAES192-CBC': PBES1Algorithm,
        'pbeWithSHA256AndAES256-CBC': PBES1Algorithm,
        'id-sc-pbeWithGost3411AndGost28147': PBES1Algorithm,
        'id-sc-pbeWithGost3411AndGost28147CFB': PBES1Algorithm,
        'PBES2': PBES2Algorithm
    });


    // </editor-fold>    

    /*
     * Public Key Info 
     * 
     * http://tools.ietf.org/html/rfc5280
     * 
     */ // <editor-fold defaultstate="collapsed">

    var DHPublicKey = {
        encode: function(value) {
            return INTEGER.encode(getInt16().encode(swapBytes(value)));
        },
        decode: function(value) {
            return swapBytes(getInt16().decode(INTEGER.decode(value)));
        }
    };

    var ECDHPublicKey = OCTET_STRING({
        encode: function(value) {
            var r = new Uint8Array(value.byteLength + 1),
                    d = swapBytes(value),
                    len = value.byteLength / 2;
            r[0] = 0x04; // type hex;
            r.set(new Uint8Array(d, len, len), 1); // x
            r.set(new Uint8Array(d, 0, len), len + 1); // y
            return r.buffer;
        },
        decode: function(value) {
            var d = new Uint8Array(value.byteLength - 1),
                    len = d.byteLength / 2;
            d.set(new Uint8Array(value, len + 1, len), 0); // y
            d.set(new Uint8Array(value, 1, len), len); // x
            return swapBytes(d);
        }
    });

    var GostR3410PublicKey = OCTET_STRING;
    /**
     * Subject Public Key Info Syntax X.509
     * <pre>
     *  SubjectPublicKeyInfo  ::=  SEQUENCE  {
     *      algorithm            AlgorithmIdentifier,
     *      subjectPublicKey     BIT STRING  }
     *  
     *  AlgorithmIdentifier  ::=  SEQUENCE  {
     *      algorithm               OBJECT IDENTIFIER,
     *      parameters              ANY DEFINED BY algorithm OPTIONAL  }
     -- contains a value of the type
     -- registered for use with the
     -- algorithm object identifier value     
     * </pre>
     * RFC 5280 references {@link http://tools.ietf.org/html/rfc5280} 
     * @class gostSyntax.SubjectPublicKeyInfo
     * @mixes gostSyntax.SQUENCE
     */
    var SubjectPublicKeyInfo = SEQUENCE({
        algorithm: KeyAlgorithmIdentifier,
        subjectPublicKey: BIT_STRING});

    /**
     * Coding methods for {@link Algorithm} and {@link gostSyntax.SubjectPublicKeyInfo}
     * Supported types for GOST algorithms:
     * <pre>
     *  {
     *      'id-sc-gostR3410-2001': ECDHPublicKey,
     *      'id-sc-gostR3410-94': DHPublicKey,
     *      'id-GostR3410-2001': GostR3410PublicKey,
     *      'id-GostR3410-94': GostR3410PublicKey,
     *      'id-tc26-gost3410-12-256': GostR3410PublicKey,
     *      'id-tc26-gost3410-12-512': GostR3410PublicKey
     *  }
     * </pre>
     * 
     * @class gostSyntax.GostSubjectPublicKeyInfo
     * @param {Object} PKTypes Set of key types
     */
    var GostSubjectPublicKeyInfo = (function(PKTypes) {
        return {
            /**
             * GostSubjectPublicKeyInfo.encode(value) Encode Algorithm object to gostSyntax.GostSubjectPublicKeyInfo
             * @memberOf gostSyntax.GostSubjectPublicKeyInfo
             * @param {Algorithm} value WebCrypto Algorithm identifier
             * @returns {Object} Encoded object
             */
            encode: function(value) {
                return SubjectPublicKeyInfo.encode({
                    algorithm: value.algorithm,
                    subjectPublicKey: ENCAPSULATES.encode(
                            PKTypes[value.algorithm.id].encode(value.buffer))
                });
            },
            /**
             * GostSubjectPublicKeyInfo.decode(value) Decode Algorithm object to gostSyntax.GostSubjectPublicKeyInfo
             * @memberOf gostSyntax.GostSubjectPublicKeyInfo
             * @param {Object} value Encoded object
             * @returns {Algorithm} WebCrypto Algorithm identifier
             */
            decode: function(value) {
                value = SubjectPublicKeyInfo.decode(value);
                return {
                    algorithm: value.algorithm,
                    type: 'public',
                    extractable: true,
                    usages: ['verify', 'deriveKey', 'deriveBits'],
                    buffer: PKTypes[value.algorithm.id].decode(
                            ENCAPSULATES.decode(value.subjectPublicKey))
                };
            }
        };
    })({
        'id-sc-gostR3410-2001': ECDHPublicKey,
        'id-sc-gostR3410-94': DHPublicKey,
        'id-GostR3410-2001': GostR3410PublicKey,
        'id-GostR3410-94': GostR3410PublicKey,
        'id-tc26-gost3410-12-256': GostR3410PublicKey,
        'id-tc26-gost3410-12-512': GostR3410PublicKey});
    // </editor-fold>    

    /*
     * Private Key Info PKCS#8
     * 
     * http://tools.ietf.org/html/rfc5208
     * 
     */ // <editor-fold defaultstate="collapsed">

    var PrivateKey = OCTET_STRING;

    var DHPrivateKey = {
        encode: function(value) { // for SignalCom INTEGER d
            return ENCAPSULATES(INTEGER).encode('0x' + getHex().encode(value, true));
        },
        decode: function(value) {
            return getHex().decode(ENCAPSULATES(INTEGER).decode(value).replace('0x', ''), true);
        }
    };

    var GostR3410PrivateKey = ANY;
    /**
     * Private-Key Information Syntax PKSC#8
     * <pre>
     *  -- Private-key information syntax
     *
     *  PrivateKeyInfo ::= SEQUENCE {
     *      version Version,
     *      privateKeyAlgorithm AlgorithmIdentifier {{PrivateKeyAlgorithms}},
     *      privateKey PrivateKey,
     *      attributes [0] Attributes OPTIONAL }
     *
     *  Version ::= INTEGER {v1(0)} (v1,...)
     *
     *  PrivateKey ::= OCTET STRING
     *
     *  Attributes ::= SET OF Attribute
     * </pre>
     * RFC 5208 references {@link http://tools.ietf.org/html/rfc5208} 
     * @class gostSyntax.PrivateKeyInfo
     * @mixes gostSyntax.SQUENCE
     */
    var PrivateKeyInfo = SEQUENCE({
        version: Version,
        privateKeyAlgorithm: KeyAlgorithmIdentifier,
        privateKey: PrivateKey,
        attributes: OPTIONAL(CTX(0, IMPLICIT(Attributes)))});

    var PrivateKeyAlgorithmIdentifier = KeyAlgorithmIdentifier;

    var PublicKey = BIT_STRING;

    var OneAsymmetricKey = SEQUENCE({
        version: Version,
        privateKeyAlgorithm: PrivateKeyAlgorithmIdentifier,
        privateKey: PrivateKey,
        attributes: OPTIONAL(CTX(0, IMPLICIT(Attributes))),
        publicKey: OPTIONAL(CTX(1, IMPLICIT(PublicKey)))});

    var AsymmetricKeyPackage = SEQUENCE_OF(OneAsymmetricKey);

    /**
     * Coding methods for {@link Algorithm} and {@link gostSyntax.PrivateKeyInfo}
     * Supported types for GOST algorithms:
     * <pre>
     *  {
     *      'id-sc-gostR3410-2001': DHPrivateKey,
     *      'id-sc-gostR3410-94': DHPrivateKey,
     *      'id-GostR3410-2001': GostR3410PrivateKey,
     *      'id-GostR3410-94': GostR3410PrivateKey,
     *      'id-tc26-gost3410-12-256': GostR3410PrivateKey,
     *      'id-tc26-gost3410-12-512': GostR3410PrivateKey
     *  }
     * </pre>
     * 
     * @class gostSyntax.GostPrivateKeyInfo
     * @param {Object} PKTypes Set of key types
     */
    var GostPrivateKeyInfo = (function(PKTypes) {
        return {
            /**
             * GostPrivateKeyInfo.encode(value) Encode Algorithm object to gostSyntax.PrivateKeyInfo
             * @memberOf gostSyntax.GostPrivateKeyInfo
             * @param {Algorithm} value WebCrypto Algorithm identifier
             * @returns {Object} Encoded object
             */
            encode: function(value) {
                return PrivateKeyInfo.encode({
                    version: 0,
                    privateKeyAlgorithm: value.algorithm,
                    privateKey: PKTypes[value.algorithm.id].encode(value.buffer)
                });
            },
            /**
             * GostPrivateKeyInfo.decode(value) Decode gostSyntax.PrivateKeyInfo to Algorithm object
             * @memberOf gostSyntax.GostPrivateKeyInfo
             * @param {Object} value Encoded object
             * @returns {Algorithm} WebCrypto Algorithm identifier
             */
            decode: function(value) {
                value = PrivateKeyInfo.decode(value);
                return {
                    algorithm: value.privateKeyAlgorithm,
                    type: 'private',
                    extractable: true,
                    usages: ['sign', 'deriveKey', 'deriveBits'],
                    buffer: PKTypes[value.privateKeyAlgorithm.id].decode(value.privateKey)
                };
            }
        };
    })({
        'id-sc-gostR3410-2001': DHPrivateKey,
        'id-sc-gostR3410-94': DHPrivateKey,
        'id-GostR3410-2001': GostR3410PrivateKey,
        'id-GostR3410-94': GostR3410PrivateKey,
        'id-tc26-gost3410-12-256': GostR3410PrivateKey,
        'id-tc26-gost3410-12-512': GostR3410PrivateKey});

    var KeyEncryptedData = OCTET_STRING;
    /**
     * Encrypted Private-Key Information Syntax
     * <pre>
     *  -- Encrypted private-key information syntax
     *
     *  EncryptedPrivateKeyInfo ::= SEQUENCE {
     *      encryptionAlgorithm AlgorithmIdentifier {{KeyEncryptionAlgorithms}},
     *      encryptedData EncryptedData
     *  }
     *
     *  EncryptedData ::= OCTET STRING
     *
     *  PrivateKeyAlgorithms ALGORITHM-IDENTIFIER ::= {
     *      ... -- For local profiles
     *  }
     *
     *  KeyEncryptionAlgorithms ALGORITHM-IDENTIFIER ::= {
     *      ... -- For local profiles
     *  }
     * </pre>
     * RFC 5208 references {@link http://tools.ietf.org/html/rfc5208} 
     * @class gostSyntax.EncryptedPrivateKeyInfo
     * @mixes gostSyntax.SQUENCE
     */
    var EncryptedPrivateKeyInfo = SEQUENCE({
        encryptionAlgorithm: KeyEncryptionAlgorithmIdentifier,
        encryptedData: KeyEncryptedData});
    // </editor-fold>    

    /*
     * Certificate Extensions
     * 
     * http://tools.ietf.org/html/rfc5280
     * 
     */ // <editor-fold defaultstate="collapsed">
    var UniqueIdentifier = BIT_STRING;

    var CertificateSerialNumber = INTEGER;

    var BasicConstraints = SEQUENCE({
        cA: DEFAULT(BOOLEAN, false),
        pathLenConstraint: OPTIONAL(INTEGER)
    });

    var KeyUsage = BIT_STRING({
        digitalSignature: 0,
        nonRepudiation: 1,
        keyEncipherment: 2,
        dataEncipherment: 3,
        keyAgreement: 4,
        keyCertSign: 5,
        cRLSign: 6,
        encipherOnly: 7,
        decipherOnly: 8});
    var KeyPurposeId = OBJECT_IDENTIFIER,
            ExtKeyUsageSyntax = SEQUENCE_OF(KeyPurposeId);

    var KeyIdentifier = OCTET_STRING;

    var OtherName = SEQUENCE_OF({
        type: OBJECT_IDENTIFIER,
        value: CTX(0, EXPLICIT(ANY))});

    var EDIPartyName = SEQUENCE({
        nameAssigner: OPTIONAL(CTX(0, IMPLICIT(DirectoryString))),
        partyName: OPTIONAL(CTX(1, IMPLICIT(DirectoryString)))});

    var ORAddress = SEQUENCE({});

    var GeneralName = CHOICE({
        otherName: CTX(0, IMPLICIT(OtherName)),
        rfc822Name: CTX(1, IMPLICIT(DirectoryString)),
        dNSName: CTX(2, IMPLICIT(DirectoryString)),
        x400Address: CTX(3, IMPLICIT(ORAddress)),
        directoryName: CTX(4, EXPLICIT(Name)), // Name is CHOICE(RDNSequence)
        ediPartyName: CTX(5, IMPLICIT(EDIPartyName)),
        uniformResourceIdentifier: CTX(6, IMPLICIT(DirectoryString)),
        iPAddress: CTX(7, IMPLICIT(OCTET_STRING)),
        registeredID: CTX(8, IMPLICIT(OBJECT_IDENTIFIER))});

    var GeneralNames = SEQUENCE_OF(GeneralName);

    var AuthorityKeyIdentifier = SEQUENCE({
        keyIdentifier: OPTIONAL(CTX(0, IMPLICIT(KeyIdentifier))),
        authorityCertIssuer: OPTIONAL(CTX(1, IMPLICIT(GeneralNames))),
        authorityCertSerialNumber: OPTIONAL(CTX(2, IMPLICIT(CertificateSerialNumber)))});

    var PrivateKeyUsagePeriod = SEQUENCE({
        notBefore: OPTIONAL(CTX(0, IMPLICIT(GeneralizedTime))),
        notAfter: OPTIONAL(CTX(1, IMPLICIT(GeneralizedTime)))});

    var CertPolicyId = OBJECT_IDENTIFIER,
            PolicyQualifierId = OBJECT_IDENTIFIER;

    var PolicyQualifierInfo = SEQUENCE({
        policyQualifierId: PolicyQualifierId,
        qualifier: ANY});

    var PolicyInformation = SEQUENCE({
        policyIdentifier: CertPolicyId,
        policyQualifiers: OPTIONAL(SEQUENCE_OF(PolicyQualifierInfo))});

    var PolicyMapping = SEQUENCE({
        issuerDomainPolicy: CertPolicyId,
        subjectDomainPolicy: CertPolicyId});

    var BaseDistance = INTEGER;

    var GeneralSubtree = SEQUENCE({
        base: GeneralName,
        minimum: DEFAULT(CTX(0, IMPLICIT(BaseDistance)), 0),
        maximum: OPTIONAL(CTX(1, IMPLICIT(BaseDistance)))});

    var GeneralSubtrees = SEQUENCE_OF(GeneralSubtree);

    var NameConstraints = SEQUENCE({
        permittedSubtrees: OPTIONAL(CTX(0, IMPLICIT(GeneralSubtrees))),
        excludedSubtrees: OPTIONAL(CTX(1, IMPLICIT(GeneralSubtrees)))});

    var SkipCerts = INTEGER;

    var PolicyConstraints = SEQUENCE({
        requireExplicitPolicy: OPTIONAL(CTX(0, IMPLICIT(SkipCerts))),
        inhibitPolicyMapping: OPTIONAL(CTX(1, IMPLICIT(SkipCerts)))});

    var ReasonFlags = BIT_STRING({
        unused: 0,
        keyCompromise: 1,
        cACompromise: 2,
        affiliationChanged: 3,
        superseded: 4,
        cessationOfOperation: 5,
        certificateHold: 6,
        privilegeWithdrawn: 7,
        aACompromise: 8});

    var DistributionPointName = CHOICE({
        fullName: CTX(0, IMPLICIT(GeneralNames)),
        nameRelativeToCRLIssuer: CTX(1, IMPLICIT(RelativeDistinguishedName))});

    var DistributionPoint = SEQUENCE({
        distributionPoint: OPTIONAL(CTX(0, EXPLICIT(DistributionPointName))), // DistributionPointName CHOICE
        reasons: OPTIONAL(CTX(1, IMPLICIT(ReasonFlags))),
        cRLIssuer: OPTIONAL(CTX(2, IMPLICIT(GeneralNames)))});

    var CRLDistributionPoints = SEQUENCE_OF(DistributionPoint);

    var FreshestCRL = CRLDistributionPoints;

    var AccessDescription = SEQUENCE({
        accessMethod: OBJECT_IDENTIFIER,
        accessLocation: GeneralName});

    var Extension = ATTRIBUTE(function(type) {
        return {
            extnID: OBJECT_IDENTIFIER,
            critical: DEFAULT(BOOLEAN, false),
            extnValue: OCTET_STRING(ENCAPSULATES(type))
        };
    }, 'extnID');

    var Extensions = SEQUENCE_OF(Extension, function(id, value, mask) {
        return {
            extnID: id,
            critical: mask && mask(id, value),
            extnValue: value
        };
    }, function(result, value) {
        return result[value.extnID] = value.extnValue;
    });

    var CertExtensions = Extensions({
        authorityKeyIdentifier: AuthorityKeyIdentifier,
        subjectKeyIdentifier: KeyIdentifier,
        keyUsage: KeyUsage,
        privateKeyUsagePeriod: PrivateKeyUsagePeriod,
        certificatePolicies: SEQUENCE_OF(PolicyInformation),
        policyMappings: SEQUENCE_OF(PolicyMapping),
        subjectAltName: GeneralNames,
        issuerAltName: GeneralNames,
        subjectDirectoryAttributes: AttributeSequence,
        basicConstraints: BasicConstraints,
        nameConstraints: NameConstraints,
        policyConstraints: PolicyConstraints,
        extKeyUsage: ExtKeyUsageSyntax,
        cRLDistributionPoints: CRLDistributionPoints,
        inhibitAnyPolicy: SkipCerts,
        freshestCRL: FreshestCRL,
        authorityInfoAccess: SEQUENCE_OF(AccessDescription),
        subjectInfoAccess: SEQUENCE_OF(AccessDescription)
    }, function(id, value) {
        return id === 'keyUsage' ||
                (id === 'basicConstraints' && value.pathLenConstraint === undefined);
    });
    // </editor-fold>    

    /*
     * Signature Values
     * 
     * http://tools.ietf.org/html/rfc5280
     * http://tools.ietf.org/html/rfc4491
     * 
     */ // <editor-fold defaultstate="collapsed">

    var NoSignatureValue = OCTET_STRING;

    var ECDHSignature = (function() {
        var BaseType = SEQUENCE({
            r: INTEGER,
            s: INTEGER});
        return {
            encode: function(value) {
                // r || s as integers value
                value = swapBytes(value);
                var len = value.byteLength / 2,
                        s = '0x' + getHex().encode(new Uint8Array(value, 0, len)),
                        r = '0x' + getHex().encode(new Uint8Array(value, len, len));
                return getBER().encode(BaseType.encode({r: r, s: s}));
            },
            decode: function(value) {
                var signature = BaseType.decode(getBER().decode(value));
                var r = new Uint8Array(getHex().decode(signature.r.replace('0x', ''))),
                        s = new Uint8Array(getHex().decode(signature.s.replace('0x', '')));
                var d = new Uint8Array(s.length + r.length);
                d.set(s, 0);
                d.set(r, s.length);
                return swapBytes(d.buffer);
            }
        };
    })();

    var GostR3410Signature = {
        encode: function(value) {
            // big endian s || r bit array 
            return swapBytes(value);
        },
        decode: function(value) {
            // big endian s || r bit array 
            return swapBytes(value);
        }
    };

    /**
     * Gost Signature encode signature values for different GOST signatures
     * Support algorithms:
     * <pre>
     *  {
     *      'id-GostR3410-94': GostR3410Signature,
     *      'id-GostR3410-2001': GostR3410Signature,
     *      'id-tc26-gost3410-12-256': GostR3410Signature,
     *      'id-tc26-gost3410-12-512': GostR3410Signature,
     *      'id-GostR3411-94-with-GostR3410-2001': GostR3410Signature,
     *      'id-GostR3411-94-with-GostR3410-94': GostR3410Signature,
     *      'id-tc26-signwithdigest-gost3410-12-94': GostR3410Signature,
     *      'id-tc26-signwithdigest-gost3410-12-256': GostR3410Signature,
     *      'id-tc26-signwithdigest-gost3410-12-512': GostR3410Signature,
     *      'id-sc-gostR3410-94': ECDHSignature,
     *      'id-sc-gostR3410-2001': ECDHSignature,
     *      'id-sc-gostR3411-94-with-gostR3410-94': ECDHSignature,
     *      'id-sc-gostR3411-94-with-gostR3410-2001': ECDHSignature
     *  }
     * </pre>
     * @class gostSyntax.GostSignature
     * @param {Object} aSet Set of supported algorithms
     */
    var SignatureValue = (function(aSet) {
        return function(algorithm) {
            var Type = aSet[algorithm.id];
            return {
                encode: function(value) {
                    if (Type)
                        value = Type.encode(value);
                    return value;
                },
                decode: function(value) {
                    if (value instanceof ArrayBuffer) {
                        if (Type)
                            value = Type.decode(value);
                        return value;
                    } else
                        throw new DataError('Invalid signature value');
                }
            };
        };
    })({
        noSignature: NoSignatureValue,
        'id-GostR3410-94': GostR3410Signature,
        'id-GostR3410-2001': GostR3410Signature,
        'id-GostR3411-94-with-GostR3410-2001': GostR3410Signature,
        'id-GostR3411-94-with-GostR3410-94': GostR3410Signature,
        'id-tc26-gost3410-12-256': GostR3410Signature,
        'id-tc26-gost3410-12-512': GostR3410Signature,
        'id-tc26-signwithdigest-gost3410-12-94': GostR3410Signature,
        'id-tc26-signwithdigest-gost3410-12-256': GostR3410Signature,
        'id-tc26-signwithdigest-gost3410-12-512': GostR3410Signature,
        'id-sc-gostR3410-94': ECDHSignature,
        'id-sc-gostR3410-2001': ECDHSignature,
        'id-sc-gostR3411-94-with-gostR3410-94': ECDHSignature,
        'id-sc-gostR3411-94-with-gostR3410-2001': ECDHSignature});

    var GostSignature = function(Type) {
        return {
            /**
             * Encode object with signature
             * @memberOf gostSyntax.GostSignature
             * @param {Object} value Object
             * @returns {Object} Encoded object
             */
            encode: function(value) {
                value = expand(value);
                value.signatureValue = SignatureValue(value.signatureAlgorithm).encode(value.signatureValue);
                return Type.encode(value);
            },
            /**
             * Decode object with signature
             * @memberOf gostSyntax.GostSignature
             * @param {Object} value Encoded object
             * @returns {Object} Object
             */
            decode: function(value) {
                var result = Type.decode(value);
                result.signatureValue = SignatureValue(result.signatureAlgorithm).decode(result.signatureValue);
                return result;
            }
        };
    };
    // </editor-fold>    

    /*
     * Certificate
     * 
     * http://tools.ietf.org/html/rfc5280
     * 
     */ // <editor-fold defaultstate="collapsed">

    /**
     * The sequence TBSCertificate contains information associated with the
     * subject of the certificate and the CA who issued it.  Every
     * TBSCertificate contains the names of the subject and issuer, a public
     * key associated with the subject, a validity period, a version number,
     * and a serial number; some MAY contain optional unique identifier
     * fields.  The remainder of this section describes the syntax and
     * semantics of these fields.  A TBSCertificate usually includes
     * extensions. 
     * <pre>
     *  TBSCertificate  ::=  SEQUENCE  {
     *       version         [0]  EXPLICIT Version DEFAULT v1,
     *       serialNumber         CertificateSerialNumber,
     *       signature            AlgorithmIdentifier,
     *       issuer               Name,
     *       validity             Validity,
     *       subject              Name,
     *       subjectPublicKeyInfo SubjectPublicKeyInfo,
     *       issuerUniqueID  [1]  IMPLICIT UniqueIdentifier OPTIONAL,
     *                            -- If present, version MUST be v2 or v3
     *       subjectUniqueID [2]  IMPLICIT UniqueIdentifier OPTIONAL,
     *                            -- If present, version MUST be v2 or v3
     *       extensions      [3]  EXPLICIT Extensions OPTIONAL
     *                            -- If present, version MUST be v3
     *       }
     *
     *  Version  ::=  INTEGER  {  v1(0), v2(1), v3(2)  }
     *
     *  CertificateSerialNumber  ::=  INTEGER
     *
     *  Validity ::= SEQUENCE {
     *       notBefore      Time,
     *       notAfter       Time }
     *
     *  Time ::= CHOICE {
     *       utcTime        UTCTime,
     *       generalTime    GeneralizedTime }
     *
     *  UniqueIdentifier  ::=  BIT STRING
     *
     *  SubjectPublicKeyInfo  ::=  SEQUENCE  {
     *       algorithm            AlgorithmIdentifier,
     *       subjectPublicKey     BIT STRING  }
     *
     *  Extensions  ::=  SEQUENCE SIZE (1..MAX) OF Extension
     *
     *  Extension  ::=  SEQUENCE  {
     *       extnID      OBJECT IDENTIFIER,
     *       critical    BOOLEAN DEFAULT FALSE,
     *       extnValue   OCTET STRING  }
     * </pre>
     * See {@link gostSyntax.Certificate} and {@link gostSyntax.SubjectPublicKeyInfo}<br><br>
     * RFC 5280 references {@link http://tools.ietf.org/html/rfc5280} 
     * 
     * @class gostSyntax.TBSCertificate
     * @mixes gostSyntax.SEQUENCE
     */
    var TBSCertificate = SEQUENCE({
        version: CTX(0, EXPLICIT(Version)),
        serialNumber: CertificateSerialNumber,
        signature: SignatureAlgorithmIdentifier,
        issuer: Name,
        validity: Validity,
        subject: Name,
        subjectPublicKeyInfo: SubjectPublicKeyInfo,
        issuerUniqueID: OPTIONAL(CTX(1, IMPLICIT(UniqueIdentifier))), // If present, version MUST be v2 or v3        
        subjectUniqueID: OPTIONAL(CTX(2, IMPLICIT(UniqueIdentifier))), // If present, version MUST be v2 or v3
        extensions: OPTIONAL(CTX(3, EXPLICIT(CertExtensions)))}); // If present, version MUST be v3        

    /**
     * The X.509 v3 certificate basic syntax is as follows.  For signature
     * calculation, the data that is to be signed is encoded using the ASN.1
     * distinguished encoding rules (DER) [X.690].  ASN.1 DER encoding is a
     * tag, length, value encoding system for each element.
     * <pre>
     *  Certificate  ::=  SEQUENCE  {
     *       tbsCertificate       TBSCertificate,
     *       signatureAlgorithm   AlgorithmIdentifier,
     *       signatureValue       BIT STRING  }
     * </pre>
     * See {@link gostSyntax.TBSCertificate}<br><br>
     * RFC 5280 references {@link http://tools.ietf.org/html/rfc5280} 
     * 
     * @class gostSyntax.Certificate
     * @mixes gostSyntax.GostSignature
     */
    var Certificate = GostSignature(SEQUENCE({
        tbsCertificate: TBSCertificate,
        signatureAlgorithm: SignatureAlgorithmIdentifier,
        signatureValue: BIT_STRING}));
    // </editor-fold>    

    /*
     * Certification Request
     * 
     * http://tools.ietf.org/html/rfc2986
     * 
     */ // <editor-fold defaultstate="collapsed">

    var ExtensionRequest = CertExtensions;

    var CRIAttributes = Attributes({
        challengePassword: SET_OF_SINGLE(DirectoryString),
        extensionRequest: SET_OF_SINGLE(ExtensionRequest),
        msCertExtensions: SET_OF_SINGLE(CertExtensions),
        extendedCertificateAttributes: SET_OF_SINGLE(Attributes)});

    /**
     * Certification request information shall have ASN.1 type CertificationRequestInfo:
     * <pre>
     *  CertificationRequestInfo ::= SEQUENCE {
     *       version       INTEGER { v1(0) } (v1,...),
     *       subject       Name,
     *       subjectPKInfo SubjectPublicKeyInfo{{ PKInfoAlgorithms }},
     *       attributes    [0] Attributes{{ CRIAttributes }}
     *  }
     *
     *  SubjectPublicKeyInfo { ALGORITHM : IOSet} ::= SEQUENCE {
     *       algorithm        AlgorithmIdentifier {{IOSet}},
     *       subjectPublicKey BIT STRING
     *  }
     *
     *  PKInfoAlgorithms ALGORITHM ::= {
     *       ...  -- add any locally defined algorithms here -- }
     *
     *  Attributes { ATTRIBUTE:IOSet } ::= SET OF Attribute{{ IOSet }}
     *
     *  CRIAttributes  ATTRIBUTE  ::= {
     *       ... -- add any locally defined attributes here -- }
     *
     *  Attribute { ATTRIBUTE:IOSet } ::= SEQUENCE {
     *       type   ATTRIBUTE.&id({IOSet}),
     *       values SET SIZE(1..MAX) OF ATTRIBUTE.&Type({IOSet}{@type})
     *  }
     * </pre>
     * See {@link gostSyntax.CertificationRequest} and {@link gostSyntax.SubjectPublicKeyInfo}<br><br>
     * RFC 2986 references {@link http://tools.ietf.org/html/rfc2986} 
     * 
     * @class gostSyntax.CertificationRequestInfo
     * @mixes gostSyntax.SEQUENCE
     */
    var CertificationRequestInfo = SEQUENCE({
        version: INTEGER,
        subject: Name,
        subjectPublicKeyInfo: SubjectPublicKeyInfo,
        attributes: CTX(0, IMPLICIT(CRIAttributes))});

    /**
     * A certification request consists of three parts: "certification
     * request information," a signature algorithm identifier, and a digital
     * signature on the certification request information.  The
     * certification request information consists of the entity's
     * distinguished name, the entity's public key, and a set of attributes
     * providing other information about the entity.
     * <pre>
     *  A certification request shall have ASN.1 type CertificationRequest:
     *
     *  CertificationRequest ::= SEQUENCE {
     *       certificationRequestInfo CertificationRequestInfo,
     *       signatureAlgorithm AlgorithmIdentifier{{ SignatureAlgorithms }},
     *       signature          BIT STRING
     *  }
     *
     *  AlgorithmIdentifier {ALGORITHM:IOSet } ::= SEQUENCE {
     *       algorithm          ALGORITHM.&id({IOSet}),
     *       parameters         ALGORITHM.&Type({IOSet}{@algorithm}) OPTIONAL
     *  }
     *
     *  SignatureAlgorithms ALGORITHM ::= {
     *       ... -- add any locally defined algorithms here -- }
     * </pre>
     * See {@link gostSyntax.CertificationRequestInfo}
     * RFC 2986 references {@link http://tools.ietf.org/html/rfc2986} 
     * @class gostSyntax.CertificationRequest
     * @mixes gostSyntax.GostSignature
     */
    var CertificationRequest = GostSignature(SEQUENCE({
        requestInfo: CertificationRequestInfo,
        signatureAlgorithm: SignatureAlgorithmIdentifier,
        signatureValue: BIT_STRING}));
    // </editor-fold>    

    /*
     * Certificate Revocation List
     * 
     * http://tools.ietf.org/html/rfc5280
     * 
     */ // <editor-fold defaultstate="collapsed">

    var CRLNumber = INTEGER;

    var CRLReason = ENUMERATED({
        unspecified: 0,
        keyCompromise: 1,
        cACompromise: 2,
        affiliationChanged: 3,
        superseded: 4,
        cessationOfOperation: 5,
        certificateHold: 6,
        removeFromCRL: 8,
        privilegeWithdrawn: 9,
        aACompromise: 10});

    var IssuingDistributionPoint = SEQUENCE({
        distributionPoint: OPTIONAL(CTX(0, EXPLICIT(DistributionPointName))), // DistributionPointName is CHOICE
        onlyContainsUserCerts: DEFAULT(CTX(1, IMPLICIT(BOOLEAN)), false),
        onlyContainsCACerts: DEFAULT(CTX(2, IMPLICIT(BOOLEAN)), false),
        onlySomeReasons: OPTIONAL(CTX(3, IMPLICIT(ReasonFlags))),
        indirectCRL: DEFAULT(CTX(4, IMPLICIT(BOOLEAN)), false),
        onlyContainsAttributeCerts: DEFAULT(CTX(5, IMPLICIT(BOOLEAN)), false)});

    var CLRExtensions = Extensions({
        authorityKeyIdentifier: AuthorityKeyIdentifier,
        issuerAltName: GeneralNames,
        cRLNumber: CRLNumber,
        deltaCRLIndicator: CRLNumber,
        issuingDistributionPoint: IssuingDistributionPoint,
        freshestCRL: FreshestCRL
    }, function(id) {
        return id === 'cRLNumber';
    });

    var CLREntryExtensions = Extensions({
        cRLReason: CRLReason,
        instructionCode: OBJECT_IDENTIFIER,
        invalidityDate: GeneralizedTime,
        certificateIssuer: GeneralNames});

    /**
     * This field is itself a sequence containing the name of the issuer, 
     * issue date, issue date of the next list, the optional list of revoked
     * certificates, and optional CRL extensions.  When there are no revoked
     * certificates, the revoked certificates list is absent.  When one or
     * more certificates are revoked, each entry on the revoked certificate
     * list is defined by a sequence of user certificate serial number,
     * revocation date, and optional CRL entry extensions.
     * <pre>
     *  TBSCertList  ::=  SEQUENCE  {
     *       version                 Version OPTIONAL,
     *                                    -- if present, MUST be v2
     *       signature               AlgorithmIdentifier,
     *       issuer                  Name,
     *       thisUpdate              Time,
     *       nextUpdate              Time OPTIONAL,
     *       revokedCertificates     SEQUENCE OF SEQUENCE  {
     *            userCertificate         CertificateSerialNumber,
     *            revocationDate          Time,
     *            crlEntryExtensions      Extensions OPTIONAL
     *                                          -- if present, MUST be v2
     *                                 }  OPTIONAL,
     *       crlExtensions           [0]  EXPLICIT Extensions OPTIONAL
     *                                          -- if present, MUST be v2
     *                                 }
     * </pre>
     * See {@link gostSyntax.CertificateList}<br><br>
     * RFC 5280 references {@link http://tools.ietf.org/html/rfc5280} 
     * 
     * @class gostSyntax.TBSCertList
     */
    var TBSCertList = SEQUENCE({
        version: OPTIONAL(Version), // if present, MUST be v2
        signature: SignatureAlgorithmIdentifier,
        issuer: Name,
        thisUpdate: Time,
        nextUpdate: OPTIONAL(Time),
        revokedCertificates: OPTIONAL(SEQUENCE_OF(SEQUENCE({
            userCertificate: CertificateSerialNumber,
            revocationDate: Time,
            crlEntryExtensions: OPTIONAL(CLREntryExtensions) // if present, MUST be v2
        }))),
        crlExtensions: OPTIONAL(CTX(0, EXPLICIT(CLRExtensions)))}); // if present, MUST be v2

    /**
     * The X.509 v2 CRL syntax is as follows.  For signature calculation,
     * the data that is to be signed is ASN.1 DER encoded.  ASN.1 DER
     * encoding is a tag, length, value encoding system for each element.
     * <pre>
     *  CertificateList  ::=  SEQUENCE  {
     *       tbsCertList          TBSCertList,
     *       signatureAlgorithm   AlgorithmIdentifier,
     *       signatureValue       BIT STRING  }
     * </pre>
     * See {@link gostSyntax.TBSCertList}<br><br>
     * RFC 5280 references {@link http://tools.ietf.org/html/rfc5280} 
     * 
     * @class gostSyntax.CertificateList
     * @mixes gostSyntax.GostSignature
     */
    var CertificateList = GostSignature(SEQUENCE({
        tbsCertList: TBSCertList,
        signatureAlgorithm: SignatureAlgorithmIdentifier,
        signatureValue: BIT_STRING}));
    // </editor-fold>    

    /*
     * Attribute Certificate Definision
     * http://tools.ietf.org/html/rfc5755
     * 
     */ // <editor-fold defaultstate="collapsed">

    var AttCertVersion = INTEGER;

    var ObjectDigestInfo = SEQUENCE({
        digestedObjectType: ENUMERATED({
            publicKey: 0,
            publicKeyCert: 1,
            otherObjectTypes: 2
        }), // otherObjectTypes MUST NOT be used in this profile
        otherObjectTypeID: OPTIONAL(OBJECT_IDENTIFIER),
        digestAlgorithm: DigestAlgorithmIdentifier,
        objectDigest: BIT_STRING});

    var IssuerSerial = SEQUENCE({
        issuer: GeneralNames,
        serial: CertificateSerialNumber,
        issuerUID: OPTIONAL(UniqueIdentifier)});

    var V2Form = SEQUENCE({
        issuerName: OPTIONAL(GeneralNames),
        baseCertificateID: OPTIONAL(CTX(0, IMPLICIT(IssuerSerial))),
        // issuerName MUST be present in this profile baseCertificateID and 
        // objectDigestInfo MUST NOT be present in this profile
        objectDigestInfo: OPTIONAL(CTX(1, IMPLICIT(ObjectDigestInfo)))});

    var TargetCert = SEQUENCE({
        targetCertificate: IssuerSerial,
        targetName: OPTIONAL(GeneralName),
        certDigestInfo: OPTIONAL(ObjectDigestInfo)});

    var Target = CHOICE({
        targetName: CTX(0, EXPLICIT(GeneralName)), // GeneralName is CHOICE
        targetGroup: CTX(1, EXPLICIT(GeneralName)),
        targetCert: CTX(2, IMPLICIT(TargetCert))});

    var Targets = SEQUENCE_OF(Target);

    var AttCertExtensions = Extensions({
        auditIdentity: OCTET_STRING,
        targetInformation: Targets,
        authorityKeyIdentifier: AuthorityKeyIdentifier,
        authorityInfoAccess: SEQUENCE_OF(AccessDescription),
        cRLDistributionPoints: CRLDistributionPoints,
        noRevAvail: NULL
    }, function(id) {
        return id === 'auditIdentity' || id === 'targetInformation';
    });

    var Holder = SEQUENCE({
        // the issuer and serial number of the holder's Public Key Certificate
        baseCertificateID: OPTIONAL(CTX(0, IMPLICIT(IssuerSerial))),
        // the name of the claimant or role
        entityName: OPTIONAL(CTX(1, IMPLICIT(GeneralNames))),
        // used to directly authenticate the holder, for example, an executable
        objectDigestInfo: OPTIONAL(CTX(2, IMPLICIT(ObjectDigestInfo)))});

    var AttCertIssuer = CHOICE({
        v1Form: GeneralNames, // MUST NOT be used in this profile
        v2Form: CTX(0, IMPLICIT(V2Form))});     // v2 only

    var AttCertValidityPeriod = SEQUENCE({
        notBeforeTime: GeneralizedTime,
        notAfterTime: GeneralizedTime});

    var SvceAuthInfo = SEQUENCE({
        service: GeneralName,
        ident: GeneralName,
        authInfo: OPTIONAL(OCTET_STRING)});

    var RoleSyntax = SEQUENCE({
        roleAuthority: OPTIONAL(CTX(0, IMPLICIT(GeneralNames))),
        roleName: CTX(1, EXPLICIT(GeneralName))}); // GeneralName is CHOICE

    var ClassList = BIT_STRING({
        unmarked: 0,
        unclassified: 1,
        restricted: 2,
        confidential: 3,
        secret: 4,
        topSecret: 5});

    var SecurityCategory = SEQUENCE({
        type: CTX(0, IMPLICIT(OBJECT_IDENTIFIER)),
        value: CTX(1, IMPLICIT(ANY))});

    var Clearance = SEQUENCE({
        policyId: CTX(0, IMPLICIT(OBJECT_IDENTIFIER)),
        classList: DEFAULT(CTX(1, IMPLICIT(ClassList)), ['unclassified']),
        securityCategories: OPTIONAL(CTX(2, IMPLICIT(SET_OF(SecurityCategory))))});

    var IetfAttrSyntax = SEQUENCE({
        policyAuthority: OPTIONAL(CTX(0, IMPLICIT(GeneralNames))),
        values: SEQUENCE_OF(CHOICE({
            octets: OCTET_STRING,
            oid: OBJECT_IDENTIFIER,
            string: UTF8String}))});

    /**
     * X.509 Attribute Certificate Definition<br><br>
     * 
     * X.509 contains the definition of an AC given below.  All types that
     * are not defined in this document can be found in [PKIXPROF].
     * <pre>
     *           AttributeCertificateInfo ::= SEQUENCE {
     *                version              AttCertVersion -- version is v2,
     *                holder               Holder,
     *                issuer               AttCertIssuer,
     *                signature            AlgorithmIdentifier,
     *                serialNumber         CertificateSerialNumber,
     *                attrCertValidityPeriod   AttCertValidityPeriod,
     *                attributes           SEQUENCE OF Attribute,
     *                issuerUniqueID       UniqueIdentifier OPTIONAL,
     *                extensions           Extensions OPTIONAL
     *           }
     * <pre>
     * RFC 3281 references {@link http://tools.ietf.org/html/rfc3281} 
     * 
     * @class gostSyntax.AttributeCertificateInfo
     */
    var AttributeCertificateInfo = SEQUENCE({
        version: AttCertVersion, // version is v2,
        holder: Holder,
        issuer: AttCertIssuer,
        signature: SignatureAlgorithmIdentifier,
        serialNumber: CertificateSerialNumber,
        attrCertValidityPeriod: AttCertValidityPeriod,
        attributes: AttributeSequence({
            authenticationInfo: SET_OF(SvceAuthInfo),
            accessIdentity: SET_OF(SvceAuthInfo),
            chargingIdentity: SET_OF_SINGLE(IetfAttrSyntax),
            group: SET_OF_SINGLE(IetfAttrSyntax),
            role: SET_OF(RoleSyntax),
            clearance: SET_OF(Clearance)
        }),
        issuerUniqueID: OPTIONAL(UniqueIdentifier),
        extensions: OPTIONAL(AttCertExtensions)
    });

    /**
     * Attribute Certificate Profile<br></br>
     *
     * ACs may be used in a wide range of applications and environments
     * covering a broad spectrum of interoperability goals and a broader
     * spectrum of operational and assurance requirements.  The goal of this
     * document is to establish a common baseline for generic applications
     * requiring broad interoperability and limited special purpose
     * requirements.  In particular, the emphasis will be on supporting the
     * use of attribute certificates for informal Internet electronic mail,
     * IPSec, and WWW applications.
     * <pre>
     *           AttributeCertificate ::= SEQUENCE {
     *                acinfo               AttributeCertificateInfo,
     *                signatureAlgorithm   AlgorithmIdentifier,
     *                signatureValue       BIT STRING
     *           }
     * </pre>
     * See {@link gostSyntax.AttributeCertificateInfo}<br><br>
     * RFC 3281 references {@link http://tools.ietf.org/html/rfc3281} 
     * 
     * @class gostSyntax.AttributeCertificate
     * @mixes gostSyntax.GostSignature
     */
    var AttributeCertificate = GostSignature(SEQUENCE({
        acinfo: AttributeCertificateInfo,
        signatureAlgorithm: SignatureAlgorithmIdentifier,
        signatureValue: BIT_STRING}));
    // </editor-fold>    

    /*
     * Encrypted Key with CMS
     * 
     * http://tools.ietf.org/html/rfc5652
     * http://tools.ietf.org/html/rfc4490
     * 
     */ // <editor-fold defaultstate="collapsed">

    // Value type depends on algorithm
    var AlgorithmValue = function(aSet) {
        return function(algorithm) {
            var Type = aSet[algorithm.id];
            Type = (Type && Type.call && Type(algorithm)) || Type;
            return {
                encode: function(value) {
                    if (Type)
                        value = Type.encode(value);
                    return value;
                },
                decode: function(value) {
                    if (Type)
                        value = Type.decode(value);
                    return value;
                }
            };
        };
    };

    // RecipientInfo
    var EncryptedKey = OCTET_STRING;

    var EncryptedContent = OCTET_STRING;

    var SubjectKeyIdentifier = OCTET_STRING;

    var UserKeyingMaterial = OCTET_STRING;

    var MQVuserKeyingMaterial = SEQUENCE({// ECC rfc5753 KeyAgreeRecipientInfo in ukm
        ephemeralPublicKey: OriginatorPublicKey,
        addedukm: OPTIONAL(CTX(0, EXPLICIT(UserKeyingMaterial)))
    });

    var ECCCMSSharedInfo = SEQUENCE({
        keyInfo: KeyWrapAlgorithmIdentifier,
        entityUInfo: OPTIONAL(CTX(0, EXPLICIT(OCTET_STRING))),
        suppPubInfo: CTX(2, EXPLICIT(OCTET_STRING))
    });

    // GOST Key Transport & Key agreement rfc4490
    var Gost2814789EncryptedKey = SEQUENCE({
        encryptedKey: Gost2814789Key,
        maskKey: OPTIONAL(CTX(0, IMPLICIT(Gost2814789Key))),
        macKey: Gost2814789MAC
    });

    var GostR3410TransportParameters = SEQUENCE({
        encryptionParamSet: Gost2814789ParamSet,
        ephemeralPublicKey: OPTIONAL(CTX(0, IMPLICIT(GostSubjectPublicKeyInfo))),
        ukm: OCTET_STRING}); // ( SIZE(8) )

    var GostR3410KeyTransport = SEQUENCE({
        sessionEncryptedKey: Gost2814789EncryptedKey,
        transportParameters: OPTIONAL(CTX(0, IMPLICIT(GostR3410TransportParameters)))
    });

    var SCGostKeyTransport = SEQUENCE({
        sessionEncryptedKey: Gost2814789EncryptedKey,
        ukm: SEQUENCE({
            ephemeralPublicKey: GostSubjectPublicKeyInfo,
            addedukm: OPTIONAL(CTX(0, EXPLICIT(UserKeyingMaterial)))})});

    var CPEncryptedKey = function(algorithm) {
        return {
            encode: function(value) {
                // wrappedKey: (UKM(8) | CEK_ENC(32) | CEK_MAC(4)), now we ignore UKM
                var CEK_ENC = new Uint8Array(new Uint8Array(value, 8, 32)).buffer,
                        CEK_MAC = new Uint8Array(new Uint8Array(value, 40, 4)).buffer;
                return {
                    encryptedKey: CEK_ENC,
                    macKey: CEK_MAC
                };
            },
            decode: function(value) {
                var UKM = algorithm.ukm,
                        CEK_ENC = value.encryptedKey,
                        CEK_MAC = value.macKey;
                var encryptedKey = new Uint8Array(UKM.byteLength + CEK_ENC.byteLength + CEK_MAC.byteLength);
                encryptedKey.set(new Uint8Array(UKM), 0);
                encryptedKey.set(new Uint8Array(CEK_ENC), 8);
                encryptedKey.set(new Uint8Array(CEK_MAC), 40);
                return encryptedKey;
            }
        };
    };

    var CPKeyAgreement = function(algorithm) {
        var Type = CPEncryptedKey(algorithm);
        return {
            encode: function(value) {
                return Gost2814789EncryptedKey.encode(Type.encode(value));
            },
            decode: function(value) {
                return Type.decode(Gost2814789EncryptedKey.decode(value));
            }
        };
    };

    var CPKeyTransport = function(algorithm) {
        return {
            encode: function(value) {
                return GostR3410KeyTransport.encode({
                    sessionEncryptedKey: CPEncryptedKey(algorithm).encode(value),
                    transportParameters: {// from algorithm identifier
                        encryptionParamSet: getAttributes('sBox')[algorithm.wrapping.sBox || 'E-A'],
                        ephemeralPublicKey: algorithm['public'],
                        ukm: algorithm.ukm
                    }
                });
            },
            decode: function(value) {
                value = GostR3410KeyTransport.decode(value);
                algorithm.wrapping = getParameters(value.transportParameters.encryptionParamSet);
                algorithm.ukm = value.transportParameters.ukm;
                algorithm['public'] = value.transportParameters.ephemeralPublicKey;
                return CPEncryptedKey(algorithm).decode(value.sessionEncryptedKey);
            }
        };
    };

    var SCEncryptedKey = function(algorithm) {
        return {
            encode: function(value) {
                // wrappedKey: (CEK_ENC(32) | CEK_MAC(4))
                var CEK_ENC = new Uint8Array(new Uint8Array(value, 0, 32)).buffer,
                        CEK_MAC = new Uint8Array(new Uint8Array(value, 32, 4)).buffer;
                return {// from wrapped key
                    encryptedKey: CEK_ENC,
                    macKey: CEK_MAC
                };
            },
            decode: function(value) {
                var CEK_ENC = value.encryptedKey,
                        CEK_MAC = value.macKey;
                var encryptedKey = new Uint8Array(CEK_ENC.byteLength + CEK_MAC.byteLength);
                encryptedKey.set(new Uint8Array(CEK_ENC), 0);
                encryptedKey.set(new Uint8Array(CEK_MAC), 32);
                return encryptedKey;
            }
        };
    };

    var SCKeyTransport = function(algorithm) {
        return {
            encode: function(value) {
                return SCGostKeyTransport.encode({
                    sessionEncryptedKey: SCEncryptedKey(algorithm).encode(value),
                    ukm: {// from algorithm identifier
                        ephemeralPublicKey: algorithm['public'],
                        addedukm: algorithm.ukm
                    }
                });
            },
            decode: function(value) {
                value = SCGostKeyTransport.decode(value);
                algorithm.ukm = value.ukm.addedukm;
                algorithm['public'] = value.ukm.ephemeralPublicKey;
                return SCEncryptedKey(algorithm).decode(value.sessionEncryptedKey);
            }
        };
    };

    var SCKeyAgreement = function(algorithm) {
        var Type = SCEncryptedKey(algorithm);
        return {
            encode: function(value) {
                return Gost2814789EncryptedKey.encode(Type.encode(value));
            },
            decode: function(value) {
                return Type.decode(Gost2814789EncryptedKey.decode(value));
            }
        };
    };

    var EncryptedKeyValue = AlgorithmValue({
        // Key transport algorithms
        'id-sc-gostR3410-2001': SCKeyTransport,
        'id-sc-gostR3410-94': SCKeyTransport,
        'id-GostR3410-2001': CPKeyTransport,
        'id-GostR3410-94': CPKeyTransport,
        'id-tc26-gost3410-12-256': CPKeyTransport,
        'id-tc26-gost3410-12-512': CPKeyTransport,
        // Key agreement algorithms
        'id-GostR3410-94-CryptoPro-ESDH': CPKeyAgreement,
        'id-GostR3410-2001-CryptoPro-ESDH': CPKeyAgreement,
        'id-tc26-agreement-gost-3410-12-256': CPKeyAgreement,
        'id-tc26-agreement-gost-3410-12-512': CPKeyAgreement,
        'id-sc-r3410-ESDH-r3411kdf': SCKeyAgreement,
        // Key encryption key algorithms
        'id-Gost28147-89-None-KeyWrap': CPKeyAgreement,
        'id-Gost28147-89-CryptoPro-KeyWrap': CPKeyAgreement,
        'id-sc-cmsGostWrap': SCKeyAgreement,
        'id-sc-cmsGost28147Wrap': SCKeyAgreement});

    var GostEncryptedKey = function(Type) {
        return {
            encode: function(value) {
                value = expand(value);
                value.encryptedKey = ENCAPSULATES(EncryptedKeyValue(value.keyEncryptionAlgorithm)).encode(value.encryptedKey);
                return Type.encode(value);
            },
            decode: function(value) {
                var result = Type.decode(value);
                result.encryptedKey = ENCAPSULATES(EncryptedKeyValue(result.keyEncryptionAlgorithm)).decode(result.encryptedKey);
                return result;
            }
        };
    };

    var GostKeyAgreeEncryptedKey = function(Type) {
        return {
            encode: function(value) {
                value = expand(value);
                var algorithm = value.keyEncryptionAlgorithm;
                var encaps = ENCAPSULATES(EncryptedKeyValue(algorithm));
                value.recipientEncryptedKeys = value.recipientEncryptedKeys.map(function(item) {
                    item = expand(item);
                    item.encryptedKey = encaps.encode(item.encryptedKey);
                    return item;
                });
                value.ukm = value.ukm || algorithm.ukm;
                return Type.encode(value);
            },
            decode: function(value) {
                var result = Type.decode(value);
                var algorithm = result.keyEncryptionAlgorithm;
                algorithm.ukm = algorithm.ukm || result.ukm;
                var encaps = ENCAPSULATES(EncryptedKeyValue(algorithm));
                result.recipientEncryptedKeys.forEach(function(item) {
                    item.encryptedKey = encaps.decode(item.encryptedKey);
                });
                return result;
            }
        };
    }; // </editor-fold>

    /*
     * Cryptographic Message Syntax
     * 
     * http://tools.ietf.org/html/rfc5652
     * 
     */ // <editor-fold defaultstate="collapsed">

    // CMS signed data
    var CMSVersion = INTEGER;

    var ContentType = OBJECT_IDENTIFIER;

    var SigningTime = Time;

    var SubjectKeyIdentifier = OCTET_STRING;

    var Digest = OCTET_STRING;

    var MessageAuthenticationCode = OCTET_STRING;

    var BodyPartID = INTEGER;

    var BodyPartPath = SEQUENCE_OF(BodyPartID);

    var CMCUnsignedData = SEQUENCE({
        bodyPartPath: BodyPartPath,
        identifier: OBJECT_IDENTIFIER,
        content: ANY}); // DEFINED BY identifier

    var SignedAttributes = Attributes({
        contentType: SET_OF_SINGLE(ContentType),
        messageDigest: SET_OF_SINGLE(OCTET_STRING),
        signingTime: SET_OF_SINGLE(SigningTime)});

    var UnsignedAttributes = Attributes({
        countersignature: SET_OF(Countersignature),
        unsignedData: SET_OF(CMCUnsignedData)});

    var AuthAttributes = SignedAttributes,
            UnauthAttributes = Attributes,
            UnprotectedAttributes = Attributes;

    var IssuerAndSerialNumber = SEQUENCE({
        issuer: Name,
        serialNumber: CertificateSerialNumber});

    var SignerIdentifier = CHOICE({
        issuerAndSerialNumber: IssuerAndSerialNumber,
        subjectKeyIdentifier: CTX(0, IMPLICIT(SubjectKeyIdentifier))});

    var SignerInfo = GostSignature(SEQUENCE({
        version: CMSVersion,
        sid: SignerIdentifier,
        digestAlgorithm: DigestAlgorithmIdentifier,
        signedAttrs: OPTIONAL(CTX(0, IMPLICIT(SignedAttributes))),
        signatureAlgorithm: SignatureAlgorithmIdentifier,
        signatureValue: OCTET_STRING,
        unsignedAttrs: OPTIONAL(CTX(1, IMPLICIT(UnsignedAttributes)))}));

    var Countersignature = SignerInfo,
            SignerInfos = SET_OF(SignerInfo),
            DigestAlgorithmIdentifiers = SET_OF(DigestAlgorithmIdentifier),
            AttributeCertificateV2 = AttributeCertificate;

    var ExtendedCertificateInfo = SEQUENCE({
        version: CMSVersion,
        certificate: Certificate,
        attributes: UnauthAttributes});

    var ExtendedCertificate = SEQUENCE({
        extendedCertificateInfo: ExtendedCertificateInfo,
        signatureAlgorithm: SignatureAlgorithmIdentifier,
        signatureValue: BIT_STRING});

    var OtherCertificateFormat = SEQUENCE({
        otherCertFormat: OBJECT_IDENTIFIER,
        otherCert: ANY});

    var AttributeCertificateInfoV1 = SEQUENCE({
        version: INTEGER,
        subject: CHOICE({
            baseCertificateID: CTX(0, IMPLICIT(IssuerSerial)), // associated with a Public Key Certificate
            subjectName: CTX(1, IMPLICIT(GeneralNames))}), //associated with a name
        issuer: GeneralNames,
        signature: SignatureAlgorithmIdentifier,
        serialNumber: CertificateSerialNumber,
        attCertValidityPeriod: AttCertValidityPeriod,
        attributes: AttributeSequence,
        issuerUniqueID: OPTIONAL(UniqueIdentifier),
        extensions: OPTIONAL(CertExtensions)});

    var AttributeCertificateV1 = GostSignature(SEQUENCE({
        acInfo: AttributeCertificateInfoV1,
        signatureAlgorithm: SignatureAlgorithmIdentifier,
        signatureValue: BIT_STRING}));

    var EncapsulatedContentInfo = SEQUENCE({
        eContentType: ContentType,
        eContent: OPTIONAL(CTX(0, EXPLICIT(OCTET_STRING)))});

    var CertificateChoices = CHOICE({
        certificate: Certificate,
        extendedCertificate: CTX(0, IMPLICIT(ExtendedCertificate)), // Obsolete
        v1AttrCert: CTX(1, IMPLICIT(AttributeCertificateV1)), // Obsolete
        v2AttrCert: CTX(2, IMPLICIT(AttributeCertificateV2)),
        other: CTX(3, IMPLICIT(OtherCertificateFormat))});

    var OtherRevocationInfoFormat = SEQUENCE({
        otherRevInfoFormat: OBJECT_IDENTIFIER,
        otherRevInfo: ANY});

    var RevocationInfoChoice = CHOICE({
        crl: CertificateList,
        other: CTX(1, IMPLICIT(OtherRevocationInfoFormat))});

    var CertificateSet = SET_OF(CertificateChoices),
            RevocationInfoChoices = SET_OF(RevocationInfoChoice);

    var SignedData = SEQUENCE({
        version: CMSVersion,
        digestAlgorithms: DigestAlgorithmIdentifiers,
        encapContentInfo: EncapsulatedContentInfo,
        certificates: OPTIONAL(CTX(0, IMPLICIT(CertificateSet))),
        crls: OPTIONAL(CTX(1, IMPLICIT(RevocationInfoChoices))),
        signerInfos: SignerInfos});

    var RecipientIdentifier = CHOICE({
        issuerAndSerialNumber: IssuerAndSerialNumber,
        subjectKeyIdentifier: CTX(0, IMPLICIT(SubjectKeyIdentifier))});

    var KeyTransRecipientInfo = GostEncryptedKey(SEQUENCE({
        version: CMSVersion, // always set to 0 or 2
        rid: RecipientIdentifier,
        keyEncryptionAlgorithm: KeyEncryptionAlgorithmIdentifier,
        encryptedKey: EncryptedKey}));

    var OtherKeyAttribute = SEQUENCE({
        keyAttrId: OBJECT_IDENTIFIER,
        keyAttr: OPTIONAL(ANY)});

    var RecipientKeyIdentifier = SEQUENCE({
        subjectKeyIdentifier: SubjectKeyIdentifier,
        date: OPTIONAL(GeneralizedTime),
        other: OPTIONAL(OtherKeyAttribute)});

    var KeyAgreeRecipientIdentifier = CHOICE({
        issuerAndSerialNumber: IssuerAndSerialNumber,
        rKeyId: CTX(0, IMPLICIT(RecipientKeyIdentifier))});

    var RecipientEncryptedKey = SEQUENCE({
        rid: KeyAgreeRecipientIdentifier,
        encryptedKey: EncryptedKey});

    var RecipientEncryptedKeys = SEQUENCE_OF(RecipientEncryptedKey);

    var OriginatorPublicKey = SEQUENCE({
        algorithm: KeyAlgorithmIdentifier,
        publicKey: BIT_STRING});

    var OriginatorIdentifierOrKey = CHOICE({
        issuerAndSerialNumber: IssuerAndSerialNumber,
        subjectKeyIdentifier: CTX(0, IMPLICIT(SubjectKeyIdentifier)),
        originatorKey: CTX(1, IMPLICIT(OriginatorPublicKey))});

    var KeyAgreeRecipientInfo = GostKeyAgreeEncryptedKey(SEQUENCE({
        version: CMSVersion, // always set to 3
        originator: CTX(0, EXPLICIT(OriginatorIdentifierOrKey)),
        ukm: OPTIONAL(CTX(1, EXPLICIT(UserKeyingMaterial))),
        keyEncryptionAlgorithm: KeyEncryptionAlgorithmIdentifier,
        recipientEncryptedKeys: RecipientEncryptedKeys}));

    var KEKIdentifier = SEQUENCE({
        keyIdentifier: OCTET_STRING,
        date: OPTIONAL(GeneralizedTime),
        other: OPTIONAL(OtherKeyAttribute)});

    var KEKRecipientInfo = GostEncryptedKey(SEQUENCE({
        version: CMSVersion, // always set to 4
        kekid: KEKIdentifier,
        keyEncryptionAlgorithm: KeyEncryptionAlgorithmIdentifier,
        encryptedKey: EncryptedKey}));

    var PasswordRecipientInfo = GostEncryptedKey(SEQUENCE({
        version: CMSVersion, // always set to 0
        keyDerivationAlgorithm: OPTIONAL(CTX(0, IMPLICIT(KeyDerivationAlgorithmIdentifier))),
        keyEncryptionAlgorithm: KeyEncryptionAlgorithmIdentifier,
        encryptedKey: EncryptedKey}));

    var OtherRecipientInfo = SEQUENCE({
        oriType: OBJECT_IDENTIFIER,
        oriValue: ANY});

    var RecipientInfo = CHOICE({
        ktri: KeyTransRecipientInfo,
        kari: CTX(1, IMPLICIT(KeyAgreeRecipientInfo)),
        kekri: CTX(2, IMPLICIT(KEKRecipientInfo)),
        pwri: CTX(3, IMPLICIT(PasswordRecipientInfo)),
        ori: CTX(4, IMPLICIT(OtherRecipientInfo))});

    var OriginatorInfo = SEQUENCE({
        certs: OPTIONAL(CTX(0, IMPLICIT(CertificateSet))),
        crls: OPTIONAL(CTX(1, IMPLICIT(RevocationInfoChoices)))});

    var RecipientInfos = SET_OF(RecipientInfo);

    // EncryptedContentInfo
    var EncryptedContentInfo = SEQUENCE({
        contentType: ContentType,
        contentEncryptionAlgorithm: ContentEncryptionAlgorithmIdentifier,
        encryptedContent: OPTIONAL(CTX(0, IMPLICIT(EncryptedContent)))});

    // EnvelopedData
    var EnvelopedData = SEQUENCE({
        version: CMSVersion,
        originatorInfo: OPTIONAL(CTX(0, IMPLICIT(OriginatorInfo))),
        recipientInfos: RecipientInfos,
        encryptedContentInfo: EncryptedContentInfo,
        unprotectedAttrs: OPTIONAL(CTX(1, IMPLICIT(UnprotectedAttributes)))});

    // DigestedData
    var DigestedData = SEQUENCE({
        version: CMSVersion,
        digestAlgorithm: DigestAlgorithmIdentifier,
        encapContentInfo: EncapsulatedContentInfo,
        digest: Digest});

    // EncryptedData
    var EncryptedData = SEQUENCE({
        version: CMSVersion,
        encryptedContentInfo: EncryptedContentInfo,
        unprotectedAttrs: OPTIONAL(CTX(1, IMPLICIT(UnprotectedAttributes)))});

    // AuthenticatedData
    var AuthenticatedData = SEQUENCE({
        version: CMSVersion,
        originatorInfo: OPTIONAL(CTX(0, IMPLICIT(OriginatorInfo))),
        recipientInfos: RecipientInfos,
        macAlgorithm: MessageAuthenticationCodeAlgorithm,
        digestAlgorithm: OPTIONAL(CTX(1, DigestAlgorithmIdentifier)),
        encapContentInfo: EncapsulatedContentInfo,
        authAttrs: OPTIONAL(CTX(2, IMPLICIT(AuthAttributes))),
        mac: MessageAuthenticationCode,
        unauthAttrs: OPTIONAL(CTX(3, IMPLICIT(UnauthAttributes)))});

    // AuthEnvelopedData RFC 5911
    var AuthEnvelopedData = SEQUENCE({
        version: CMSVersion,
        originatorInfo: OPTIONAL(CTX(0, IMPLICIT(OriginatorInfo))),
        recipientInfos: RecipientInfos,
        authEncryptedContentInfo: EncryptedContentInfo,
        authAttrs: OPTIONAL(CTX(1, IMPLICIT(AuthAttributes))),
        mac: MessageAuthenticationCode,
        unauthAttrs: OPTIONAL(CTX(2, IMPLICIT(UnauthAttributes)))});

    // EncryptedKeyPackage rfc6032
    var EncryptedKeyPackage = CHOICE({
        encrypted: EncryptedData,
        enveloped: CTX(0, IMPLICIT(EnvelopedData)),
        authEnveloped: CTX(1, IMPLICIT(AuthEnvelopedData))});

    /**
     * Cryptographic Message Syntax<br>
     * The CMS associates a content type identifier with a content. The syntax 
     * MUST have ASN.1 type ContentInfo:
     * <pre>
     *  ContentInfo ::= SEQUENCE {
     *    contentType ContentType,
     *    content [0] EXPLICIT ANY DEFINED BY contentType }
     *
     *  ContentType ::= OBJECT IDENTIFIER
     * </pre>
     * The fields of ContentInfo have the following meanings:
     * <ul>
     * <li>contentType indicates the type of the associated content.  It is
     * an object identifier; it is a unique string of integers assigned
     * by an authority that defines the content type.</li>
     * <li>content is the associated content.  The type of content can be
     * determined uniquely by contentType.  Content types for data,
     * signed-data, enveloped-data, digested-data, encrypted-data, and
     * authenticated-data are defined in this document.  If additional
     * content types are defined in other documents, the ASN.1 type
     * defined SHOULD NOT be a CHOICE type.</li>
     * </ul>
     * RFC 5652 references {@link http://tools.ietf.org/html/rfc5652} 
     * 
     * @class gostSyntax.ContentInfo
     * @mixes gostSyntax.SEQUENCE
     */
    var ContentType = OBJECT_IDENTIFIER;

    var ContentInfo = ATTRIBUTE(function(type) {
        return {
            contentType: ContentType,
            content: CTX(0, EXPLICIT(type))};
    }, 'contentType', ContentType)({
        data: OCTET_STRING,
        signedData: SignedData,
        envelopedData: EnvelopedData,
        digestedData: DigestedData,
        encryptedData: EncryptedData,
        authData: AuthenticatedData,
        encryptedKeyPkg: EncryptedKeyPackage,
        aKeyPackage: AsymmetricKeyPackage});

    var DigestInfo = SEQUENCE({
        digestAlgorithm: DigestAlgorithmIdentifier,
        digest: Digest});
    // </editor-fold>    

    /*
     * PFX format syntax PKCS#12
     * 
     * http://tools.ietf.org/html/rfc7292
     * 
     */ // <editor-fold defaultstate="collapsed">

    var PKCS12Attributes = Attributes({
        friendlyName: SET_OF_SINGLE(BMPString),
        localKeyId: SET_OF_SINGLE(OCTET_STRING)});

    var SafeBagType = OBJECT_IDENTIFIER;

    var CertType = OBJECT_IDENTIFIER;

    var CRLType = OBJECT_IDENTIFIER;

    var SecretType = OBJECT_IDENTIFIER;

    var KeyBag = PrivateKeyInfo;

    var PKCS8ShroudedKeyBag = EncryptedPrivateKeyInfo;

    var CertBag = ATTRIBUTE(function(type) {
        return {
            certId: CertType,
            certValue: CTX(0, EXPLICIT(type))};
    }, 'certId', CertType)({
        // DER-encoded X.509 certificate stored in OCTET STRING
        x509Certificate: OCTET_STRING(ENCAPSULATES(Certificate)),
        // Base64-encoded SDSI certificate stored in IA5String
        sdsiCertificate: IA5String
    }, OCTET_STRING);

    var CRLBag = ATTRIBUTE(function(type) {
        return {
            crlId: CRLType,
            crlValue: CTX(0, EXPLICIT(type))};
    }, 'crlId', CRLType)({
        // DER-encoded X.509 certificate stored in OCTET STRING
        x509CRL: OCTET_STRING(ENCAPSULATES(CertificateList))
    }, OCTET_STRING);

    var SecretBag = ATTRIBUTE(function(type) {
        return {
            secretTypeId: SecretType,
            secretValue: CTX(0, EXPLICIT(type))
        };
    }, 'secretTypeId', SecretType)({
        secret: OCTET_STRING
    }, OCTET_STRING);

    var SafeBag = ATTRIBUTE(function(type) {
        return {
            bagId: SafeBagType,
            bagValue: CTX(0, EXPLICIT(type)),
            bagAttributes: OPTIONAL(PKCS12Attributes)};
    }, 'bagId', SafeBagType)(function(type) {
        return ({
            keyBag: KeyBag,
            pkcs8ShroudedKeyBag: PKCS8ShroudedKeyBag,
            certBag: CertBag,
            crlBag: CRLBag,
            secretBag: SecretBag,
            safeContentsBag: SafeContents // recursion
        })[type];
    });

    /**
     * The SafeContents Type<br><br>
     * 
     * The sixth type of bag that can be held in a SafeBag is a
     * SafeContents. This recursive structure allows for arbitrary nesting
     * of multiple KeyBags, PKCS8ShroudedKeyBags, CertBags, CRLBags, and
     * SecretBags within the top-level SafeContents.
     * <pre>
     *  SafeContents ::= SEQUENCE OF SafeBag
     *   SafeBag ::= SEQUENCE {
     *       bagId BAG-TYPE.&id ({PKCS12BagSet})
     *       bagValue [0] EXPLICIT BAG-TYPE.&Type({PKCS12BagSet}{@bagId}),
     *       bagAttributes SET OF PKCS12Attribute OPTIONAL
     *   }
     *   
     *   PKCS12Attribute ::= SEQUENCE {
     *       attrId ATTRIBUTE.&id ({PKCS12AttrSet}),
     *       attrValues SET OF ATTRIBUTE.&Type ({PKCS12AttrSet}{@attrId})
     *   } -- This type is compatible with the X.500 type ’Attribute’
     *   
     *   PKCS12AttrSet ATTRIBUTE ::= {
     *       friendlyName | -- from PKCS #9 [23]
     *       localKeyId, -- from PKCS #9
     *       ... -- Other attributes are allowed
     *   }
     * </pre>
     * The SafeContents type is made up of SafeBags. Each SafeBag holds one
     * piece of information -- a key, a certificate, etc. -- which is
     * identified by an object identifier.<br><br>
     * 
     * See {@link gostSyntax.ContentInfo} and {@link gostSyntax.PFX}<br><br>
     * 
     * RFC 7292 references {@link http://tools.ietf.org/html/rfc7292} 
     * @class gostSyntax.SafeContents
     * @mixes gostSyntax.SEQUENCE_OF
     */
    var SafeContents = SEQUENCE_OF(SafeBag);

    /**
     * The AuthenticatedSafe<br><br>
     * Each compliant platform shall be able to import and export
     * AuthenticatedSafe PDUs wrapped in PFX PDUs.<br>
     * For integrity, the AuthenticatedSafe is either signed (if public-key
     * integrity mode is used) or MACed (if password integrity mode is used)
     * to produce a PFX PDU.
     * <pre>
     *      AuthenticatedSafe ::= SEQUENCE OF ContentInfo
     * 
     *      -- Data if unencrypted
     *      -- EncryptedData if password-encrypted
     *      -- EnvelopedData if public key-encrypted
     * </pre>
     * As mentioned, the contentType field of authSafe shall be of type data
     * or signedData. The content field of the authSafe shall, either
     * directly (data case) or indirectly (signedData case), contain a BER-
     * encoded value of type AuthenticatedSafe.<br><br>
     * 
     * See {@link gostSyntax.ContentInfo} and {@link gostSyntax.PFX}<br><br>
     * 
     * RFC 7292 references {@link http://tools.ietf.org/html/rfc7292} 
     * @class gostSyntax.AuthenticatedSafe
     * @mixes gostSyntax.SEQUENCE_OF
     */
    var AuthenticatedSafe = SEQUENCE_OF(ContentInfo);

    var MacData = SEQUENCE({
        mac: DigestInfo,
        macSalt: OCTET_STRING,
        // Note: The default is for historical reasons and its use is deprecated.
        iterations: DEFAULT(INTEGER, 1)});

    /**
     * PFX format syntax<br><br>
     * 
     * This format corresponds to the data model presented above, with
     * wrappers for privacy and integrity. This section makes free
     * reference to PKCS #7 {@link gostSyntax.ContentInfo}<br>
     * All modes of direct exchange use the same PDU format.  ASN.1 and BER-
     * encoding ensure platform independence.<br>
     * This standard has one ASN.1 export: PFX.  This is the outer integrity
     * wrapper.<br><br>
     * Instances of PFX contain:
     *  <ol>
     *  <li>A version indicator.  The version shall be v3 for this version of
     *      this document.</li>
     *  <li>A PKCS #7 ContentInfo, whose contentType is signedData in public-
     *      key integrity mode and data in password integrity mode.</li>
     *  <li>An optional instance of MacData, present only in password
     *      integrity.  This object, if present, contains a PKCS #7
     *      DigestInfo, which holds the MAC value, a macSalt, and an
     *      iterationCount.  As described in Appendix B, the MAC key is
     *      derived from the password, the macSalt, and the iterationCount;
     *      the MAC is computed from the authSafe value and the MAC key via HMAC.  
     *      The password and the MAC key are not actually present anywhere in the PFX.  
     *      The salt and (to a certain extent) the iteration count thwarts dictionary
     *      attacks against the integrity password. </li>
     *  </ol>
     *  <pre>
     *  PFX ::= SEQUENCE {
     *      version     INTEGER {v3(3)}(v3,...),
     *      authSafe    ContentInfo,
     *      macData     MacData OPTIONAL
     *  }
     *
     *  MacData ::= SEQUENCE {
     *      mac         DigestInfo,
     *      macSalt     OCTET STRING,
     *      iterations  INTEGER DEFAULT 1
     *      -- Note: The default is for historical reasons and its
     *      --       use is deprecated.
     *  }
     *  </pre>
     * See {@link gostSyntax.ContentInfo}<br><br>
     * 
     * RFC 7292 references {@link http://tools.ietf.org/html/rfc7292} 
     * @class gostSyntax.PFX
     * @mixes gostSyntax.SEQUENCE
     */
    var PFX = SEQUENCE({
        version: INTEGER,
        authSafe: ContentInfo,
        macData: OPTIONAL(MacData)});
    // </editor-fold>    

    /*
     * Certificate Request Message Format 
     * 
     * http://tools.ietf.org/html/rfc4211
     * 
     */ // <editor-fold defaultstate="collapsed">

    var RegToken = UTF8String;

    var Authenticator = UTF8String;

    var CertId = SEQUENCE({
        issuer: GeneralName,
        serialNumber: INTEGER});
    var OldCertId = CertId;

    var ProtocolEncrKey = SubjectPublicKeyInfo;

    var EncryptedValue = SEQUENCE({
        // the intended algorithm for which the value will be used
        intendedAlg: OPTIONAL(CTX(0, IMPLICIT(AlgorithmIdentifier))),
        // the symmetric algorithm used to encrypt the value
        symmAlg: OPTIONAL(CTX(1, IMPLICIT(AlgorithmIdentifier))),
        // the (encrypted) symmetric key used to encrypt the value
        encSymmKey: OPTIONAL(CTX(2, IMPLICIT(BIT_STRING))),
        // algorithm used to encrypt the symmetric key
        keyAlg: OPTIONAL(CTX(3, IMPLICIT(AlgorithmIdentifier))),
        valueHint: OPTIONAL(CTX(4, IMPLICIT(OCTET_STRING))),
        // a brief description or identifier of the encValue content
        // (may be meaningful only to the sending entity, and used only
        // if EncryptedValue might be re-examined by the sending entity
        // in the future)
        encValue: BIT_STRING});
    var KeyGenParameters = OCTET_STRING;

    // The encrypted private key MUST be placed in the envelopedData
    // encryptedContentInfo encryptedContent OCTET STRING.
    var EncryptedKey = CHOICE({
        encryptedValue: EncryptedValue, // Deprecated
        envelopedData: CTX(0, IMPLICIT(EnvelopedData))});

    var PKIArchiveOptions = CHOICE({
        // the actual value of the private key
        encryptedPrivKey: CTX(0, EncryptedKey),
        // parameters that allow the private key to be re-generated
        keyGenParameters: CTX(1, IMPLICIT(KeyGenParameters)),
        // set to TRUE if sender wishes receiver to archive the private
        // key of a key pair that the receiver generates in response to
        // this request; set to FALSE if no archival is desired.
        archiveRemGenPrivKey: CTX(2, IMPLICIT(BOOLEAN))});

    var SinglePubInfo = SEQUENCE({
        pubMethod: INTEGER({
            dontCare: 0,
            x500: 1,
            web: 2,
            ldap: 3}),
        pubLocation: OPTIONAL(GeneralName)});

    // pubInfos MUST NOT be present if action is "dontPublish"
    // (if action is "pleasePublish" and pubInfos is omitted,
    // "dontCare" is assumed)
    var PKIPublicationInfo = SEQUENCE({
        action: INTEGER({
            dontPublish: 0,
            pleasePublish: 1}),
        pubInfos: OPTIONAL(SEQUENCE_OF(SinglePubInfo))});

    var SubsequentMessage = INTEGER({
        // requests that resulting certificate be encrypted for the
        // end entity (following which, POP will be proven in a
        // confirmation message)
        encrCert: 0,
        // requests that CA engage in challenge-response exchange with
        // end entity in order to prove private key possession
        challengeResp: 1});

    var POPOPrivKey = CHOICE({
        // possession is proven in this message (which contains the private
        // key itself (encrypted for the CA))
        thisMessage: CTX(0, IMPLICIT(BIT_STRING)), // Deprecated
        subsequentMessage: CTX(1, IMPLICIT(SubsequentMessage)),
        // possession will be proven in a subsequent message
        dhMAC: CTX(2, IMPLICIT(BIT_STRING)), // Deprecated
        agreeMAC: CTX(3, IMPLICIT(PKMACValue)),
        encryptedKey: CTX(4, IMPLICIT(EnvelopedData))});

    var PBMParameter = SEQUENCE({
        salt: OCTET_STRING,
        // AlgId for a One-Way Function (SHA-1 recommended)
        owf: AlgorithmIdentifier,
        // number of times the OWF is applied
        iterationCount: INTEGER,
        // the MAC AlgId (e.g., DES-MAC, Triple-DES-MAC [PKCS11], or HMAC [HMAC, RFC2202])
        mac: AlgorithmIdentifier});

    var PKMACValue = SEQUENCE({
        // algorithm value shall be PasswordBasedMac {1 2 840 113533 7 66 13}
        // parameter value is PBMParameter
        algId: AlgorithmIdentifier,
        value: BIT_STRING});

    var POPOSigningKeyInput = SEQUENCE({
        authInfo: CHOICE({
            // used only if an authenticated identity has been
            // established for the sender (e.g., a DN from a
            // previously-issued and currently-valid certificate)
            sender: CTX(0, EXPLICIT(GeneralName)), // GeneralName choice - explicit
            // used if no authenticated GeneralName currently exists for
            // the sender; publicKeyMAC contains a password-based MAC
            // on the DER-encoded value of publicKey
            publicKeyMAC: PKMACValue}),
        publicKey: SubjectPublicKeyInfo});  // from CertTemplate

    var POPOSigningKey = SEQUENCE({
        poposkInput: OPTIONAL(CTX(0, POPOSigningKeyInput)),
        algorithmIdentifier: AlgorithmIdentifier,
        signature: BIT_STRING});

    var ProofOfPossession = CHOICE({
        // used if the RA has already verified that the requester is in
        // possession of the private key
        raVerified: CTX(0, IMPLICIT(NULL)),
        signature: CTX(1, IMPLICIT(POPOSigningKey)),
        keyEncipherment: CTX(2, IMPLICIT(POPOPrivKey)),
        keyAgreement: CTX(3, IMPLICIT(POPOPrivKey))});

    var Controls = SEQUENCE_OF(AttributeTypeAndValue({
        regToken: RegToken,
        authenticator: Authenticator,
        pkiPublicationInfo: PKIPublicationInfo,
        pkiArchiveOptions: PKIArchiveOptions,
        oldCertID: OldCertId,
        protocolEncrKey: ProtocolEncrKey}));

    var OptionalValidity = SEQUENCE({
        notBefore: OPTIONAL(CTX(0, IMPLICIT(Time))),
        notAfter: OPTIONAL(CTX(1, IMPLICIT(Time)))}); // at least one MUST be present

    var CertTemplate = SEQUENCE({
        version: OPTIONAL(CTX(0, IMPLICIT(Version))),
        serialNumber: OPTIONAL(CTX(1, IMPLICIT(INTEGER))),
        signingAlg: OPTIONAL(CTX(2, IMPLICIT(AlgorithmIdentifier))),
        issuer: OPTIONAL(CTX(3, IMPLICIT(Name))),
        validity: OPTIONAL(CTX(4, IMPLICIT(OptionalValidity))),
        subject: OPTIONAL(CTX(5, IMPLICIT(Name))),
        publicKey: OPTIONAL(CTX(6, IMPLICIT(SubjectPublicKeyInfo))),
        issuerUID: OPTIONAL(CTX(7, IMPLICIT(UniqueIdentifier))),
        subjectUID: OPTIONAL(CTX(8, IMPLICIT(UniqueIdentifier))),
        extensions: OPTIONAL(CTX(9, IMPLICIT(Extensions)))});

    var CertRequest = SEQUENCE({
        certReqId: INTEGER, // ID for matching request and reply
        certTemplate: CertTemplate, // Selected fields of cert to be issued
        controls: OPTIONAL(Controls)});   // Attributes affecting issuance

    var UTF8Pairs = UTF8String;

    var CertReq = CertRequest;

    var EncKeyWithID = SEQUENCE({
        privateKey: PrivateKeyInfo,
        identifier: OPTIONAL(CHOICE([UTF8String, GeneralName]))});

    var CertReqMsg = SEQUENCE({
        certReq: CertRequest,
        popo: OPTIONAL(ProofOfPossession),
        // content depends upon key type
        regInfo: OPTIONAL(SEQUENCE_OF(AttributeTypeAndValue({
            utf8Pairs: UTF8Pairs,
            certReq: CertReq,
            encKeyWithID: EncKeyWithID})))});

    var CertReqMessages = SEQUENCE_OF(CertReqMsg);

    // </editor-fold>    

    /*
     * Certificate Management over CMS
     * 
     * http://tools.ietf.org/html/rfc5272
     * 
     */ // <editor-fold defaultstate="collapsed">

    var PendInfo = SEQUENCE({
        pendToken: OCTET_STRING,
        pendTime: GeneralizedTime});

    var CMCStatus = INTEGER({
        success: 0,
        failed: 2,
        pending: 3,
        noSupport: 4,
        confirmRequired: 5,
        popRequired: 6,
        partial: 7});

    var CMCFailInfo = INTEGER({
        badAlg: 0,
        badMessageCheck: 1,
        badRequest: 2,
        badTime: 3,
        badCertId: 4,
        unsupportedExt: 5,
        mustArchiveKeys: 6,
        badIdentity: 7,
        popRequired: 8,
        popFailed: 9,
        noKeyReuse: 10,
        internalCAError: 11,
        tryLater: 12,
        authDataFail: 13});

    var CMCStatusInfo = SEQUENCE({
        cMCStatus: CMCStatus,
        bodyList: SEQUENCE_OF(BodyPartID),
        statusString: OPTIONAL(UTF8String),
        otherInfo: OPTIONAL(CHOICE({
            failInfo: CMCFailInfo,
            pendInfo: PendInfo}))});

    var AddExtensions = SEQUENCE({
        pkiDataReference: BodyPartID,
        certReferences: SEQUENCE_OF(BodyPartID),
        extensions: SEQUENCE_OF(Extension)});

    var EncryptedPOP = SEQUENCE({
        request: TaggedRequest,
        cms: ContentInfo,
        thePOPAlgID: AlgorithmIdentifier,
        witnessAlgID: AlgorithmIdentifier,
        witness: OCTET_STRING});

    var LraPopWitness = SEQUENCE({
        pkiDataBodyid: BodyPartID,
        bodyIds: SEQUENCE_OF(BodyPartID)});

    var GetCert = SEQUENCE({
        issuerName: GeneralName,
        serialNumber: INTEGER});

    var GetCRL = SEQUENCE({
        issuerName: Name,
        cRLName: OPTIONAL(GeneralName),
        time: OPTIONAL(GeneralizedTime),
        reasons: OPTIONAL(ReasonFlags)});

    var RevokeRequest = SEQUENCE({
        issuerName: Name,
        serialNumber: INTEGER,
        reason: CRLReason,
        invalidityDate: OPTIONAL(GeneralizedTime),
        passphrase: OPTIONAL(OCTET_STRING),
        comment: OPTIONAL(UTF8String)});

    var DecryptedPOP = SEQUENCE({
        bodyPartID: BodyPartID,
        thePOPAlgID: AlgorithmIdentifier,
        thePOP: OCTET_STRING});

    var CMCCertId = IssuerAndSerialNumber;

    var BodyPartReference = CHOICE({
        bodyPartID: BodyPartID,
        bodyPartPath: BodyPartPath});

    var CMCStatusInfoV2 = SEQUENCE({
        cMCStatus: CMCStatus,
        bodyList: SEQUENCE_OF(BodyPartReference),
        statusString: OPTIONAL(UTF8String),
        otherInfo: OPTIONAL(CHOICE({
            failInfo: CMCFailInfo,
            pendInfo: PendInfo,
            extendedFailInfo: SEQUENCE({
                failInfoOID: OBJECT_IDENTIFIER,
                failInfoValue: AttributeValue})}))});

    var PublishTrustAnchors = SEQUENCE({
        seqNumber: INTEGER,
        hashAlgorithm: AlgorithmIdentifier,
        anchorHashes: SEQUENCE_OF(OCTET_STRING)});

    var AuthPublish = BodyPartID;

    var BodyPartList = SEQUENCE_OF(BodyPartID);

    var CMCPublicationInfo = SEQUENCE({
        hashAlg: AlgorithmIdentifier,
        certHashes: SEQUENCE_OF(OCTET_STRING),
        pubInfo: PKIPublicationInfo});

    var ModCertTemplate = SEQUENCE({
        pkiDataReference: BodyPartPath,
        certReferences: BodyPartList,
        replace: DEFAULT(BOOLEAN, true),
        certTemplate: CertTemplate});

    var ControlsProcessed = SEQUENCE({
        bodyList: SEQUENCE_OF(BodyPartReference)});

    var IdentifyProofV2 = SEQUENCE({
        proofAlgID: AlgorithmIdentifier,
        macAlgId: AlgorithmIdentifier,
        witness: OCTET_STRING});

    var PopLinkWitnessV2 = SEQUENCE({
        keyGenAlgorithm: AlgorithmIdentifier,
        macAlgorithm: AlgorithmIdentifier,
        witness: OCTET_STRING});

    var TaggedAttribute = IDENTIFIED_BY(function(type) {
        return SEQUENCE({
            bodyPartID: BodyPartID,
            attrType: OBJECT_IDENTIFIER,
            attrValues: SET_OF(type)
        }, {
            encode: function(value) {
                return value.attrType;
            },
            decode: function(value) {
                return OBJECT_IDENTIFIER.decode(value[1]);
            }
        }, AttributeValue)({
            statusInfo: CMCStatusInfo,
            identification: UTF8String,
            identityProof: OCTET_STRING,
            dataReturn: OCTET_STRING,
            transactionId: INTEGER,
            senderNonce: OCTET_STRING,
            recipientNonce: OCTET_STRING,
            addExtensions: AddExtensions,
            encryptedPOP: EncryptedPOP,
            decryptedPOP: DecryptedPOP,
            lraPOPWitness: LraPopWitness,
            getCert: GetCert,
            getCRL: GetCRL,
            revokeRequest: RevokeRequest,
            regInfo: OCTET_STRING,
            responseInfo: OCTET_STRING,
            queryPending: OCTET_STRING,
            popLinkRandom: OCTET_STRING,
            popLinkWitness: OCTET_STRING,
            confirmCertAcceptance: CMCCertId,
            statusInfoV2: CMCStatusInfoV2,
            trustedAnchors: PublishTrustAnchors,
            authData: AuthPublish,
            batchRequests: BodyPartList,
            batchResponses: BodyPartList,
            publishCert: CMCPublicationInfo,
            modCertTemplate: ModCertTemplate,
            controlProcessed: ControlsProcessed,
            popLinkWitnessV2: PopLinkWitnessV2,
            identityProofV2: IdentifyProofV2
        });
    });
    var TaggedCertificationRequest = SEQUENCE({
        bodyPartID: BodyPartID,
        certificationRequest: CertificationRequest});

    var TaggedContentInfo = SEQUENCE({
        bodyPartID: BodyPartID,
        contentInfo: ContentInfo});

    var OtherMsg = SEQUENCE({
        bodyPartID: BodyPartID,
        otherMsgType: OBJECT_IDENTIFIER,
        otherMsgValue: ANY}); //DEFINED BY otherMsgType 

    var TaggedRequest = CHOICE({
        tcr: CTX(0, IMPLICIT(TaggedCertificationRequest)),
        crm: CTX(1, IMPLICIT(CertReqMsg)),
        orm: CTX(2, IMPLICIT(SEQUENCE({
            bodyPartID: BodyPartID,
            requestMessageType: OBJECT_IDENTIFIER,
            requestMessageValue: ANY})))}); // DEFINED BY requestMessageType

    /**
     * PKIData Content Type<br><br>
     *
     * The PKIData content type is used for the Full PKI Request.  A PKIData
     * content type is identified by:
     * <pre>
     *   id-cct-PKIData ::= {id-pkix id-cct(12) 2 }
     * </pre>
     * The ASN.1 structure corresponding to the PKIData content type is:
     * <pre>
     *   PKIData ::= SEQUENCE {
     *       controlSequence    SEQUENCE SIZE(0..MAX) OF TaggedAttribute,
     *       reqSequence        SEQUENCE SIZE(0..MAX) OF TaggedRequest,
     *       cmsSequence        SEQUENCE SIZE(0..MAX) OF TaggedContentInfo,
     *       otherMsgSequence   SEQUENCE SIZE(0..MAX) OF OtherMsg
     *   }
     * </pre>
     * All certification requests encoded into a single PKIData SHOULD be
     * for the same identity.  RAs that batch process (see Section 6.17) are
     * expected to place the PKI Requests received into the cmsSequence of a
     * PKIData. <br><br>
     * See {@link gostSyntax.ContentInfo} and {@link gostSyntax.PKIResponse}<br><br>
     * RFC 5272 references {@link http://tools.ietf.org/html/rfc5272} 
     * 
     * @class gostSyntax.PKIData
     */
    var PKIData = SEQUENCE({
        controlSequence: SEQUENCE_OF(TaggedAttribute),
        reqSequence: SEQUENCE_OF(TaggedRequest),
        cmsSequence: SEQUENCE_OF(TaggedContentInfo),
        otherMsgSequence: SEQUENCE_OF(OtherMsg)});

    /**
     * PKIResponse Content Type<br><br>
     *
     * The PKIResponse content type is used for the Full PKI Response.  The
     * PKIResponse content type is identified by:
     * <pre>
     *   id-cct-PKIResponse ::= {id-pkix id-cct(12) 3  }
     * </pre>
     * The ASN.1 structure corresponding to the PKIResponse content type is:
     * <pre>
     *    PKIResponse ::= SEQUENCE {
     *        controlSequence   SEQUENCE SIZE(0..MAX) OF TaggedAttribute,
     *        cmsSequence       SEQUENCE SIZE(0..MAX) OF TaggedContentInfo,
     *        otherMsgSequence  SEQUENCE SIZE(0..MAX) OF OtherMsg
     *    }
     *    
     *    ReponseBody ::= PKIResponse
     * </pre>
     *
     * Note: In [RFC2797], this ASN.1 type was named ResponseBody.  It has
     * been renamed to PKIResponse for clarity and the old name kept as a
     * synonym.<br><br>
     *
     * See {@link gostSyntax.ContentInfo} and {@link gostSyntax.PKIData}<br><br>
     * 
     * RFC 5272 references {@link http://tools.ietf.org/html/rfc5272} 
     * 
     * @class gostSyntax.PKIResponse
     */
    var PKIResponse = SEQUENCE({
        controlSequence: SEQUENCE_OF(TaggedAttribute),
        cmsSequence: SEQUENCE_OF(TaggedContentInfo),
        otherMsgSequence: SEQUENCE_OF(OtherMsg)});

    // </editor-fold>    

    /*
     * Formater for universal decode/encode ASN.1 objects
     * 
     * @param {string} type Object type
     * @param {string} name Format 'PEM' or 'DER'
     * @returns {Formater}
     */
    var Formater = function(type, name) // <editor-fold defaultstate="collapsed">
    {

        return {
            encode: function(value, format) {
                value = type.encode(value);
                value = getBER().encode(value);
                if ((format || 'DER').toUpperCase() === 'PEM')
                    value = getPEM().encode(value, name);
                return value;
            },
            decode: function(value) {
                if (typeof value === 'string' || value instanceof String)
                    value = getPEM().decode(value, name);
                value = getBER().decode(value);
                return type.decode(value);
            }
        };
    }; // </editor-fold>    

    /**
     * ASN.1 syntax definitions
     * 
     * @namespace gostSyntax
     */
    return {
        CanocicalName: CanocicalName,
        GostPrivateKeyInfo: Formater(GostPrivateKeyInfo, 'PRIVATE KEY'),
        GostSubjectPublicKeyInfo: Formater(GostSubjectPublicKeyInfo, 'PUBLIC KEY'),
        PrivateKeyInfo: Formater(PrivateKeyInfo, 'PRIVATE KEY'),
        EncryptedPrivateKeyInfo: Formater(EncryptedPrivateKeyInfo, 'ENCRYPTED PRIVATE KEY'),
        SubjectPublicKeyInfo: Formater(SubjectPublicKeyInfo, 'PUBLIC KEY'),
        TBSCertificate: Formater(TBSCertificate),
        Certificate: Formater(Certificate, 'CERTIFICATE'),
        CertificationRequestInfo: Formater(CertificationRequestInfo),
        CertificationRequest: Formater(CertificationRequest, 'CERTIFICATE REQUEST'),
        TBSCertList: Formater(TBSCertList),
        CertificateList: Formater(CertificateList, 'CRL'),
        AttributeCertificateInfo: Formater(AttributeCertificateInfo),
        AttributeCertificate: Formater(AttributeCertificate, 'ATTRIBUTE CERTIFICATE'),
        SignedAttributes: Formater(SignedAttributes),
        ContentInfo: Formater(ContentInfo, 'CMS'),
        SafeContents: Formater(SafeContents),
        AuthenticatedSafe: Formater(AuthenticatedSafe),
        PFX: Formater(PFX, 'PFX'),
        PKIData: Formater(PKIData, 'PKI REQUEST'),
        PKIResponse: Formater(PKIResponse, 'PKI RESPONSE')
    };

}));

