 const electron = require('electron')
const app = electron.app
const ipc = electron.ipcMain;
const dialog = electron.dialog;
const ProjectWindow = require("./projectWindow.js").ProjectWindow;
const DocumentationWindow = require("./documentationWindow.js").DocumentationWindow;
const AboutWindow = require("./aboutWindow.js").AboutWindow;
const appmenus = require('./appmenus.js');
const forceQuitDetect = require('./forceQuitDetect');
const Inklecate = require("./inklecate.js").Inklecate;

function inkJSNeedsUpdating() {
    return false;
    /* dialog.showMessageBox({
       type: 'error',
       buttons: ['Okay'],
       title: 'Export for web unavailable',
       message: "Sorry, export for web is currently disabled, until inkjs is updated to support the latest version of ink. You can download a previous version of Inky that supports inkjs and use that instead, although some of the latest features of ink may be missing."
     });
     return true;
    */
}

app.on('will-finish-launching', function () {
    app.on("open-file", function (event, path) {
        ProjectWindow.open(path);
        event.preventDefault();
    });

});

let isQuitting = false;

/*
    in case user presses quit and doesn't close the app
    if app closes inky does not quit but remains open
*/
app.on('before-quit', function () {
    isQuitting = true;
});

ipc.on("project-cancelled-close", (event) => {
    isQuitting = false;
});

/* This method will be called when Electron has finished
   initialization and is ready to create browser windows.
   Some APIs can only be used after this event occurs.
*/
app.on('ready', function () {

    app.on('window-all-closed', function () {
        if (process.platform != 'darwin' || isQuitting) {
            app.quit();
        }
    });

    /*
        creating the functinality of the top "File" menu 
    */
    appmenus.setupMenus({
        new: () => {
            ProjectWindow.createEmpty();
        },
        //My contribution
        switch: () => {
            ProjectWindow.switch();
        },
        //
        newInclude: () => {
            var win = ProjectWindow.focused();
            if (win) win.newInclude();
        },
        open: () => {
            ProjectWindow.open();
        },
        save: () => {
            var win = ProjectWindow.focused();
            if (win) win.save();
        },
        exportJson: () => {
            var win = ProjectWindow.focused();
            if (win) win.exportJson();
        },
        exportForWeb: () => {
            if( inkJSNeedsUpdating() ) return;
            var win = ProjectWindow.focused();
            if (win) win.exportForWeb();
        },
        exportJSOnly: () => {
            if( inkJSNeedsUpdating() ) return;
            var win = ProjectWindow.focused();
            if (win) win.exportJSOnly();
        },
        toggleTags: (item, focusedWindow, event) => {
            focusedWindow.webContents.send("set-tags-visible", item.checked);
        },
        nextIssue: (item, focusedWindow) => {
            focusedWindow.webContents.send("next-issue");
        },
        gotoAnything: (item, focusedWindow) => {
            focusedWindow.webContents.send("goto-anything");
        },
        addWatchExpression: (item, focusedWindow) => {
            focusedWindow.webContents.send("add-watch-expression");
        },
        showDocs: () => {
            DocumentationWindow.openDocumentation();
        },
        showAbout: () => {
            AboutWindow.showAboutWindow();
        },
        countWords: () => {
            var win = ProjectWindow.focused();
            if (win) win.countWords();
        }
    });

    let openedSpecificFile = false;
    if (process.platform == "win32" && process.argv.length > 1) {
        for (let i = 1; i < process.argv.length; i++) {
            var arg = process.argv[i];
            if (arg.indexOf(".ink") == arg.length - 4) {
                var fileToOpen = process.argv[1];
                ProjectWindow.open(fileToOpen);
                openedSpecificFile = true;
                break;
            }
        }
    }
    if (!openedSpecificFile) {
        var w = ProjectWindow.createEmpty();
    }

    // Debug
    //w.openDevTools();
});

/*
    when user quits session
    when user forcequits
*/
function finalQuit() {
    Inklecate.killSessions();
}

forceQuitDetect.onForceQuit(finalQuit);
electron.app.on("will-quit", finalQuit);
