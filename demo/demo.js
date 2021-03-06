/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *      Julian Viereck <julian DOT viereck AT gmail DOT com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */


define(function(require, exports, module) {

var net = require("ace/lib/net");
var canon = require("pilot/canon");
var event = require("pilot/event");
var Range = require("ace/range").Range;
var Editor = require("ace/editor").Editor;
var Renderer = require("ace/virtual_renderer").VirtualRenderer;
var theme = require("ace/theme/textmate");
var EditSession = require("ace/edit_session").EditSession;
var UndoManager = require("ace/undomanager").UndoManager;

var vim = require("ace/keyboard/keybinding/vim").Vim;
var emacs = require("ace/keyboard/keybinding/emacs").Emacs;
var HashHandler = require("ace/keyboard/hash_handler").HashHandler;


var modesByName;

var Doc = function(name, desc, file) {
    this.name = name;
    this.desc = desc;
    this.doc = new EditSession(file);
    this.doc.setMode(modesByName[name].mode);
    this.doc.setUndoManager(new UndoManager());
};

var WrappedDoc = function(name, desc, file) {
    Doc.apply(this, arguments);
    
    this.doc.setUseWrapMode(true);
    this.doc.setWrapLimitRange(80, 80);
};

var Mode = function(name, desc, clazz, extensions) {
    this.name = name;
    this.desc = desc;
    this.clazz = clazz;
    this.mode = new clazz();
    this.mode.name = name;
    
    this.extRe = new RegExp("^.*\\.(" + extensions.join("|") + ")$", "g");
};

Mode.prototype.supportsFile = function(filename) {
    return filename.match(this.extRe);
};



exports.launch = function(env) {
    
    var modes = [
        new Mode("c_cpp", "C/C++", require("ace/mode/c_cpp").Mode, ["c", "cpp", "cxx", "h", "hpp"]),
        new Mode("clojure", "Clojure", require("ace/mode/clojure").Mode, ["clj"]),
        new Mode("coffee", "CoffeeScript", require("ace/mode/coffee").Mode, ["coffee"]),
        new Mode("coldfusion", "ColdFusion", require("ace/mode/coldfusion").Mode, ["cfm"]),
        new Mode("csharp", "C#", require("ace/mode/csharp").Mode, ["cs"]),
        new Mode("css", "CSS", require("ace/mode/css").Mode, ["css"]),
        new Mode("groovy", "Groovy", require("ace/mode/groovy").Mode, ["groovy"]),
        new Mode("html", "HTML", require("ace/mode/html").Mode, ["html", "htm"]),
        new Mode("java", "Java", require("ace/mode/java").Mode, ["java"]),
        new Mode("javascript", "JavaScript", require("ace/mode/javascript").Mode, ["js"]),
        new Mode("json", "JSON", require("ace/mode/json").Mode, ["json"]),
        new Mode("latex", "LaTeX", require("ace/mode/latex").Mode, ["tex"]),
        new Mode("lua", "Lua", require("ace/mode/lua").Mode, ["lua"]),
        new Mode("markdown", "MarkDown", require("ace/mode/markdown").Mode, ["md", "markdown"]),
        new Mode("ocaml", "OCaml", require("ace/mode/ocaml").Mode, ["ml", "mli"]),
        new Mode("perl", "Perl", require("ace/mode/perl").Mode, ["pl", "pm"]),
        new Mode("php", "PHP",require("ace/mode/php").Mode, ["php"]),
        new Mode("powershell", "Powershell", require("ace/mode/powershell").Mode, ["ps1"]),
        new Mode("python", "Python", require("ace/mode/python").Mode, ["py"]),
        new Mode("scala", "Scala", require("ace/mode/scala").Mode, ["scala"]),
        new Mode("scss", "SCSS", require("ace/mode/scss").Mode, ["scss"]),
        new Mode("ruby", "Ruby", require("ace/mode/ruby").Mode, ["rb"]),
        new Mode("sql", "SQL", require("ace/mode/sql").Mode, ["sql"]),
        new Mode("svg", "SVG", require("ace/mode/SVG").Mode, ["svg"]),
        new Mode("text", "Text", require("ace/mode/text").Mode, ["txt"]),
        new Mode("textile", "Textile", require("ace/mode/textile").Mode, ["textile"]),
        new Mode("xml", "XML", require("ace/mode/xml").Mode, ["xml"])
    ];
    
    modesByName = {};
    modes.forEach(function(m) {
        modesByName[m.name] = m;
    });
    
    var loreIpsum = require("ace/requirejs/text!demo/docs/plaintext.txt");
    for (var i = 0; i < 5; i++) {
        loreIpsum += loreIpsum;
    }
    
    var docs = [
        new Doc(
            "javascript", "JavaScript",
            require("ace/requirejs/text!demo/docs/javascript.js")
        ),
        new WrappedDoc("text", "Plain Text", loreIpsum),
        new Doc(
            "coffee", "Coffeescript",
            require("ace/requirejs/text!demo/docs/coffeescript.coffee")
        ),
        new Doc(
            "json", "JSON",
            require("ace/requirejs/text!demo/docs/json.json")
        ),
        new Doc(
            "css", "CSS",
            require("ace/requirejs/text!demo/docs/css.css")
        ),
        new Doc(
            "scss", "SCSS",
            require("ace/requirejs/text!demo/docs/scss.scss")
        ),
        new Doc(
            "html", "HTML",
            require("ace/requirejs/text!demo/docs/html.html")
        ),
        new Doc(
            "xml", "XML",
            require("ace/requirejs/text!demo/docs/xml.xml")
        ),
        new Doc(
            "svg", "SVG",
            require("ace/requirejs/text!demo/docs/svg.svg")
        ),
        new Doc(
            "php", "PHP",
            require("ace/requirejs/text!demo/docs/javascript.js")
        ),
        new Doc(
            "coldfusion", "ColdFusion",
            require("ace/requirejs/text!demo/docs/coldfusion.cfm")
        ),
        new Doc(
            "python", "Python",
            require("ace/requirejs/text!demo/docs/python.py")
        ),
        new Doc(
            "ruby", "Ruby",
            require("ace/requirejs/text!demo/docs/ruby.rb")
        ),
        new Doc(
            "perl", "Perl",
            require("ace/requirejs/text!demo/docs/perl.pl")
        ),
        new Doc(
            "ocaml", "OCaml",
            require("ace/requirejs/text!demo/docs/ocaml.ml")
        ),
        new Doc(
            "lua", "Lua",
            require("ace/requirejs/text!demo/docs/lua.lua")
        ),
        new Doc(
            "java", "Java",
            require("ace/requirejs/text!demo/docs/java.java")
        ),
        new Doc(
            "clojure", "Clojure",
            require("ace/requirejs/text!demo/docs/clojure.clj")
        ),
        new Doc(
            "groovy", "Groovy",
            require("ace/requirejs/text!demo/docs/groovy.groovy")
        ),
        new Doc(
            "scala", "Scala",
            require("ace/requirejs/text!demo/docs/scala.scala")
        ),
        new Doc(
            "csharp", "C#",
            require("ace/requirejs/text!demo/docs/csharp.cs")
        ),
        new Doc(
            "powershell", "Powershell",
            require("ace/requirejs/text!demo/docs/powershell.ps1")
        ),
        new Doc(
            "c_cpp", "C/C++",
            require("ace/requirejs/text!demo/docs/cpp.cpp")
        ),
        new Doc(
            "markdown", "Markdown",
            require("ace/requirejs/text!demo/docs/markdown.md")
        ),
        new WrappedDoc(
            "markdown", "Markdown",
            require("ace/requirejs/text!demo/docs/markdown.md")
        ),
        new WrappedDoc(
            "textile", "Textile",
            require("ace/requirejs/text!demo/docs/textile.textile")
        ),
        new WrappedDoc(
            "latex", "LaTeX",
            require("ace/requirejs/text!demo/docs/latex.tex")
        )
    ];
    
    var docsByName = {};
    docs.forEach(function(d) {
        docsByName[d.name] = d;
    });
    
    var keybindings = {
        // Null = use "default" keymapping
        ace: null,
        vim: vim,
        emacs: emacs,
        // This is a way to define simple keyboard remappings
        custom: new HashHandler({
            "gotoright":      "Tab",
            "indent":         "]",
            "outdent":        "[",
            "gotolinestart":  "^",
            "gotolineend":    "$"
         })
    };

    var container = document.getElementById("editor");
    var cockpitInput = document.getElementById("cockpitInput");

    // Splitting.
    var Split = require("ace/split").Split;
    var split = new Split(container, theme, 1);
    env.editor = split.getEditor(0);
    split.on("focus", function(editor) {
        env.editor = editor;
        updateUIEditorOptions();
    });
    env.split = split;
    window.env = env;
    window.ace = env.editor;

    var docEl = document.getElementById("doc");
    var modeEl = document.getElementById("mode");
    var wrapModeEl = document.getElementById("soft_wrap");
    var themeEl = document.getElementById("theme");
    var selectStyleEl = document.getElementById("select_style");
    var highlightActiveEl = document.getElementById("highlight_active");
    var showHiddenEl = document.getElementById("show_hidden");
    var showGutterEl = document.getElementById("show_gutter");
    var showPrintMarginEl = document.getElementById("show_print_margin");
    var highlightSelectedWordE = document.getElementById("highlight_selected_word");
    var showHScrollEl = document.getElementById("show_hscroll");
    var softTabEl = document.getElementById("soft_tab");
    var behavioursEl = document.getElementById("enable_behaviours");

    docs.forEach(function(doc) {
        var option = document.createElement("option");
        option.setAttribute("value", doc.name);
        option.innerHTML = doc.desc;
        docEl.appendChild(option);
    });
    
    modes.forEach(function(mode) {
        var option = document.createElement("option");
        option.setAttribute("value", mode.name);
        option.innerHTML = mode.desc;
        modeEl.appendChild(option);
    });
    
    bindDropdown("doc", function(value) {
        var doc = docsByName[value].doc;
        var session = env.split.setSession(doc);
        session.name = doc.name;

        updateUIEditorOptions();

        env.editor.focus();
    });

    function updateUIEditorOptions() {
        var editor = env.editor;
        var session = editor.session;

        docEl.value = session.name;
        modeEl.value = session.getMode().name || "text";

        if (!session.getUseWrapMode()) {
            wrapModeEl.value = "off";
        } else {
            wrapModeEl.value = session.getWrapLimitRange().min || "free";
        }

        selectStyleEl.checked = editor.getSelectionStyle() == "line";
        themeEl.value = editor.getTheme();
        highlightActiveEl.checked = editor.getHighlightActiveLine();
        showHiddenEl.checked = editor.getShowInvisibles();
        showGutterEl.checked = editor.renderer.getShowGutter();
        showPrintMarginEl.checked = editor.renderer.getShowPrintMargin();
        highlightSelectedWordE.checked = editor.getHighlightSelectedWord();
        showHScrollEl.checked = editor.renderer.getHScrollBarAlwaysVisible();
        softTabEl.checked = session.getUseSoftTabs();
        behavioursEl.checked = editor.getBehavioursEnabled();
    }

    bindDropdown("mode", function(value) {
        env.editor.getSession().setMode(modesByName[value].mode || modesByName.text.mode);
    });

    bindDropdown("theme", function(value) {
        if (require.packaged) {
            loadTheme(value, function() {
                env.editor.setTheme(value);
            });
        }
        else {
            env.editor.setTheme(value);
        }
    });

    bindDropdown("keybinding", function(value) {
        env.editor.setKeyboardHandler(keybindings[value]);
    });

    bindDropdown("fontsize", function(value) {
        env.split.setFontSize(value);
    });

    bindDropdown("soft_wrap", function(value) {
        var session = env.editor.getSession();
        var renderer = env.editor.renderer;
        switch (value) {
            case "off":
                session.setUseWrapMode(false);
                renderer.setPrintMarginColumn(80);
                break;
            case "40":
                session.setUseWrapMode(true);
                session.setWrapLimitRange(40, 40);
                renderer.setPrintMarginColumn(40);
                break;
            case "80":
                session.setUseWrapMode(true);
                session.setWrapLimitRange(80, 80);
                renderer.setPrintMarginColumn(80);
                break;
            case "free":
                session.setUseWrapMode(true);
                session.setWrapLimitRange(null, null);
                renderer.setPrintMarginColumn(80);
                break;
        }
    });

    bindCheckbox("select_style", function(checked) {
        env.editor.setSelectionStyle(checked ? "line" : "text");
    });

    bindCheckbox("highlight_active", function(checked) {
        env.editor.setHighlightActiveLine(checked);
    });

    bindCheckbox("show_hidden", function(checked) {
        env.editor.setShowInvisibles(checked);
    });

    bindCheckbox("show_gutter", function(checked) {
        env.editor.renderer.setShowGutter(checked);
    });

    bindCheckbox("show_print_margin", function(checked) {
        env.editor.renderer.setShowPrintMargin(checked);
    });

    bindCheckbox("highlight_selected_word", function(checked) {
        env.editor.setHighlightSelectedWord(checked);
    });

    bindCheckbox("show_hscroll", function(checked) {
        env.editor.renderer.setHScrollBarAlwaysVisible(checked);
    });

    bindCheckbox("soft_tab", function(checked) {
        env.editor.getSession().setUseSoftTabs(checked);
    });

    bindCheckbox("enable_behaviours", function(checked) {
        env.editor.setBehavioursEnabled(checked);
    });

    var secondSession = null;
    bindDropdown("split", function(value) {
        var sp = env.split;
        if (value == "none") {
            if (sp.getSplits() == 2) {
                secondSession = sp.getEditor(1).session;
            }
            sp.setSplits(1);
        } else {
            var newEditor = (sp.getSplits() == 1);
            if (value == "below") {
                sp.setOriantation(sp.BELOW);
            } else {
                sp.setOriantation(sp.BESIDE);
            }
            sp.setSplits(2);

            if (newEditor) {
                var session = secondSession || sp.getEditor(0).session;
                var newSession = sp.setSession(session, 1);
                newSession.name = session.name;
            }
        }
    });

    function bindCheckbox(id, callback) {
        var el = document.getElementById(id);
        var onCheck = function() {
            callback(!!el.checked);
        };
        el.onclick = onCheck;
        onCheck();
    }

    function bindDropdown(id, callback) {
        var el = document.getElementById(id);
        var onChange = function() {
            callback(el.value);
        };
        el.onchange = onChange;
        onChange();
    }

    function onResize() {
        var left = env.split.$container.offsetLeft;
        var width = document.documentElement.clientWidth - left;
        container.style.width = width + "px";
        container.style.height = document.documentElement.clientHeight + "px";
        env.split.resize();
//        env.editor.resize();
    }

    window.onresize = onResize;
    env.editor.renderer.onResize(true);

    event.addListener(container, "dragover", function(e) {
        return event.preventDefault(e);
    });

    event.addListener(container, "drop", function(e) {
        var file;
        try {
            file = e.dataTransfer.files[0];
        } catch(err) {
            return event.stopEvent();
        }

        if (window.FileReader) {
            var reader = new FileReader();
            reader.onload = function(e) {
                env.editor.getSelection().selectAll();

                var mode = modesByName.text;
                for (var i = 0; i < modes.length; i++) {
                    if (modes[i].supportsFile(file.name)) {
                        mode = modes[i];
                        break;
                    }
                }

                env.editor.onTextInput(reader.result);

                modeEl.value = mode.name;
                env.editor.getSession().setMode(mode.mode);
            };
            reader.readAsText(file);
        }

        return event.preventDefault(e);
    });

    /**
     * This demonstrates how you can define commands and bind shortcuts to them.
     */

    // Fake-Save, works from the editor and the command line.
    canon.addCommand({
        name: "save",
        bindKey: {
            win: "Ctrl-S",
            mac: "Command-S",
            sender: "editor"
        },
        exec: function() {
            alert("Fake Save File");
        }
    });

    // Fake-Print with custom lookup-sender-match function.
    canon.addCommand({
        name: "print",
        bindKey: {
            win: "Ctrl-P",
            mac: "Command-P",
            sender: function(env, sender, hashId, keyString) {
                if (sender == "editor") {
                    return true;
                } else {
                    alert("Sorry, can only print from the editor");
                }
            }
        },
        exec: function() {
            alert("Fake Print File");
        }
    });

    canon.addCommand({
        name: "fold",
        bindKey: {
            win: "Alt-L",
            mac: "Alt-L",
            sender: "editor"
        },
        exec: function(env) {
            toggleFold(env, false);
        }
    });

    canon.addCommand({
        name: "unfold",
        bindKey: {
            win: "Alt-Shift-L",
            mac: "Alt-Shift-L",
            sender: "editor"
        },
        exec: function(env) {
            toggleFold(env, true);
        }
    });

    function isCommentRow(row) {
        var session = env.editor.session;
        var token;
        var tokens = session.getTokens(row, row)[0].tokens;
        var c = 0;
        for (var i = 0; i < tokens.length; i++) {
            token = tokens[i];
            if (/^comment/.test(token.type)) {
                return c;
            } else if (!/^text/.test(token.type)) {
                return false;
            }
            c += token.value.length;
        }
        return false;
    }

    function toggleFold(env, tryToUnfold) {
        var session = env.editor.session;
        var selection = env.editor.selection;
        var range = selection.getRange();
        var addFold;

        if(range.isEmpty()) {
            var br = session.findMatchingBracket(range.start);
            var fold = session.getFoldAt(range.start.row, range.start.column);
            var column;

            if (fold) {
                session.expandFold(fold);
                selection.setSelectionRange(fold.range);
            } else if (br) {
                if (range.compare(br.row, br.column) == 1)
                    range.end = br;
                else
                    range.start = br;
                addFold = true;
            } else if ((column = isCommentRow(range.start.row)) !== false) {
                var firstCommentRow = range.start.row;
                var lastCommentRow = range.start.row;
                var t;
                while ((t = isCommentRow(firstCommentRow - 1)) !== false) {
                    firstCommentRow --;
                    column = t;
                }
                while (isCommentRow(lastCommentRow + 1) !== false) {
                    lastCommentRow ++;
                }
                range.start.row = firstCommentRow;
                range.start.column = column + 2;
                range.end.row = lastCommentRow;
                range.end.column = session.getLine(lastCommentRow).length - 1;
                addFold = true;
            }
        } else {
            addFold = true;
        }
        if (addFold) {
            var placeHolder = session.getTextRange(range);
            if(placeHolder.length < 3)
                return;
            placeHolder = placeHolder.trim().substring(0, 3).replace(' ','','g') + "...";
            session.addFold(placeHolder, range);
        }
    }
};

var themes = {};
function loadTheme(name, callback) {
    if (themes[name])
        return callback();
        
    themes[name] = 1;
    var base = name.split("/").pop();
    var fileName = "src/theme-" + base + ".js";
    net.loadScript(fileName, callback);
}

});
