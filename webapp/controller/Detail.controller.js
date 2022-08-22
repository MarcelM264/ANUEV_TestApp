sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library",
  ],
  function (e, t, i, o) {
    "use strict";
    var r = o.URLHelper;
    function a(e, t) {
      var i = t.getObject().Quantity * t.getObject().UnitPrice;
      return e + i;
    }
    return e.extend("sap.ui.demo.orderbrowser.controller.Detail", {
      formatter: i,
      onInit: function () {
        this._aValidKeys = ["shipping", "processor"];
        var e = new t({
          busy: false,
          delay: 0,
          lineItemListTitle: this.getResourceBundle().getText(
            "detailLineItemTableHeading"
          ),
          currency: "EUR",
          totalOrderAmount: 0,
          selectedTab: "",
        });
        this.getRouter()
          .getRoute("object")
          .attachPatternMatched(this._onObjectMatched, this);
        this.setModel(e, "detailView");
        this.getOwnerComponent()
          .getModel()
          .metadataLoaded()
          .then(this._onMetadataLoaded.bind(this));
      },
      onSendEmailPress: function () {
        var e = this.getModel("detailView");
        r.triggerEmail(
          null,
          e.getProperty("/shareSendEmailSubject"),
          e.getProperty("/shareSendEmailMessage")
        );
      },
      onListUpdateFinished: function (e) {
        var t,
          i = 0,
          o = e.getParameter("total"),
          r = this.getModel("detailView"),
          s = e.getSource().getBinding("items"),
          n;
        if (s.isLengthFinal()) {
          if (o) {
            t = this.getResourceBundle().getText(
              "detailLineItemTableHeadingCount",
              [o]
            );
          } else {
            t = this.getResourceBundle().getText("detailLineItemTableHeading");
          }
          r.setProperty("/lineItemListTitle", t);
          n = s.getContexts();
          i = n.reduce(a, 0);
          r.setProperty("/totalOrderAmount", i);
        }
      },
      _onObjectMatched: function (e) {
        var t = e.getParameter("arguments");
        this._sObjectId = t.objectId;
        if (
          this.getModel("appView").getProperty("/layout") !==
          "MidColumnFullScreen"
        ) {
          this.getModel("appView").setProperty(
            "/layout",
            "TwoColumnsMidExpanded"
          );
        }
        this.getModel()
          .metadataLoaded()
          .then(
            function () {
              var e = this.getModel().createKey("Orders", {
                OrderID: this._sObjectId,
              });
              this._bindView("/" + e);
            }.bind(this)
          );
        var i = t["?query"];
        if (i && this._aValidKeys.indexOf(i.tab) >= 0) {
          this.getView()
            .getModel("detailView")
            .setProperty("/selectedTab", i.tab);
          this.getRouter().getTargets().display(i.tab);
        } else {
          this.getRouter().navTo(
            "object",
            { objectId: this._sObjectId, query: { tab: "shipping" } },
            true
          );
        }
      },
      _bindView: function (e) {
        var t = this.getModel("detailView");
        t.setProperty("/busy", false);
        this.getView().bindElement({
          path: e,
          parameters: { expand: "Customer,Order_Details/Product,Employee" },
          events: {
            change: this._onBindingChange.bind(this),
            dataRequested: function () {
              t.setProperty("/busy", true);
            },
            dataReceived: function () {
              t.setProperty("/busy", false);
            },
          },
        });
      },
      _onBindingChange: function () {
        var e = this.getView(),
          t = e.getElementBinding();
        if (!t.getBoundContext()) {
          this.getRouter().getTargets().display("detailObjectNotFound");
          this.getOwnerComponent().oListSelector.clearMasterListSelection();
          return;
        }
        var i = t.getPath(),
          o = this.getResourceBundle(),
          r = e.getModel().getObject(i),
          a = r.OrderID,
          s = r.OrderID,
          n = this.getModel("detailView");
        this.getOwnerComponent().oListSelector.selectAListItem(i);
        n.setProperty(
          "/shareSendEmailSubject",
          o.getText("shareSendEmailObjectSubject", [a])
        );
        n.setProperty(
          "/shareSendEmailMessage",
          o.getText("shareSendEmailObjectMessage", [
            s,
            a,
            location.href,
            r.ShipName,
            r.EmployeeID,
            r.CustomerID,
          ])
        );
      },
      _onMetadataLoaded: function () {
        var e = this.getView().getBusyIndicatorDelay(),
          t = this.getModel("detailView"),
          i = this.byId("lineItemsList"),
          o = i.getBusyIndicatorDelay();
        t.setProperty("/delay", 0);
        t.setProperty("/lineItemTableDelay", 0);
        i.attachEventOnce("updateFinished", function () {
          t.setProperty("/lineItemTableDelay", o);
        });
        t.setProperty("/busy", true);
        t.setProperty("/delay", e);
      },
      onTabSelect: function (e) {
        var t = e.getParameter("selectedKey");
        this.getRouter().navTo(
          "object",
          { objectId: this._sObjectId, query: { tab: t } },
          true
        );
      },
      _onHandleTelephonePress: function (e) {
        var t = e.getSource().getText();
        r.triggerTel(t);
      },
      onCloseDetailPress: function () {
        this.getModel("appView").setProperty(
          "/actionButtonsInfo/midColumn/fullScreen",
          false
        );
        this.getOwnerComponent().oListSelector.clearMasterListSelection();
        this.getRouter().navTo("master");
      },
      toggleFullScreen: function () {
        var e = this.getModel("appView").getProperty(
          "/actionButtonsInfo/midColumn/fullScreen"
        );
        this.getModel("appView").setProperty(
          "/actionButtonsInfo/midColumn/fullScreen",
          !e
        );
        if (!e) {
          this.getModel("appView").setProperty(
            "/previousLayout",
            this.getModel("appView").getProperty("/layout")
          );
          this.getModel("appView").setProperty(
            "/layout",
            "MidColumnFullScreen"
          );
        } else {
          this.getModel("appView").setProperty(
            "/layout",
            this.getModel("appView").getProperty("/previousLayout")
          );
        }
      },
    });
  }
);
