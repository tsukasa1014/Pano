/**
 * @namespace
 */
const gPano = {
  tabGroups: {
    onPopupShowing: function PanoMenu_init (aEvent) {
      var id = aEvent.target.id,
          isAllTabsPopup    = (id === "alltabs-popup"),
          isPanoButtonPopup = (id === "pano-toolbarbutton-popup");

      if (isAllTabsPopup || isPanoButtonPopup) {
        if (arguments.callee === gPano.tabGroups.onPopupShowing)
          Services.scriptloader.loadSubScript("chrome://pano/content/pano-menu.sub.js", gPano.tabGroups);

        gPano.tabGroups.onPopupShowing(aEvent);

        if (isAllTabsPopup) {
          aEvent.target.parentNode.removeEventListener("popupshowing", arguments.callee, true);
          aEvent.target.parentNode.addEventListener("popupshowing", gPano.tabGroups.onPopupShowing, true);
        }
      }
    },
  },
  pane: {
    toggleOpen: function PanoPane_init () {
      Cu.import("resource://pano/panoramaTree.jsm", this);
      Services.scriptloader.loadSubScript("chrome://pano/content/pano-pane.sub.js", this);
      this.toggleOpen();
      Services.scriptloader.loadSubScript("chrome://pano/content/pano-tree.sub.js", this);
    },
    isPanel: true,
  },
  buttons: (function () {
    var self = {
      observe: function Pano_observe (aSubject, aTopic, aData) {
        if (aTopic === "pano-tab-selection-changed" && aSubject === window) {
          let data = JSON.parse(aData);
          this.enableCommand(this.commands.tabHistoryForwardCmd, data.canGoForward);
          this.enableCommand(this.commands.tabHistoryBackCmd,    data.canGoBack);
        }
      },
      enableCommand: function (aCommand, aEnable) {
        if (aEnable)
          aCommand.removeAttribute("disabled");
        else
          aCommand.setAttribute("disabled", "true");
      },
      commands: {},
      QueryInterface: XPCOMUtils.generateQI(["nsIObserver", "nsISupportsWeakReference"]),
    };
    XPCOMUtils.defineLazyGetter(self.commands, "tabHistoryForwardCmd", function(){
      return document.getElementById("panoCmdTabHistoryForward")
    });
    XPCOMUtils.defineLazyGetter(self.commands, "tabHistoryBackCmd", function(){
      return document.getElementById("panoCmdTabHistoryBack")
    });
    Services.obs.addObserver(self, "pano-tab-selection-changed", true);
    return self;
  })(),
};
XPCOMUtils.defineLazyModuleGetter(gPano, "styler", "resource://pano/panoStyle.jsm", "PanoStyle");

window.addEventListener("load", function () {
  window.removeEventListener("load", arguments.callee, false);

  let (styler = gPano.styler, cssFile = gPano.styler.getCSSFile()) {
    if (cssFile.exists() && cssFile.isReadable())
      styler.load(cssFile);
    else
      styler.load(styler.defaultCSS);
  }

  var allTabsButton = document.getElementById("alltabs-button") ||
                      getNavToolbox().palette.querySelector("#alltabs-button");
  if (allTabsButton)
    allTabsButton.addEventListener("popupshowing", gPano.tabGroups.onPopupShowing, true);

  window.addEventListener("TabSelect", function () {
    window.removeEventListener("TabSelect", arguments.callee, false);
    let (tmp = {}) {
      Components.utils.import("resource://pano/tabSelectionHistory.jsm", tmp);
      gPano.tabHistory = new tmp.TabSelectionHistory(window);
    }
  }, false);
}, false);

// vim: sw=2 ts=2 et fdm=marker:
