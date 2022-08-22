sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/GroupHeaderListItem",
    "sap/ui/Device",
    "sap/ui/core/Fragment",
    "../model/formatter",
    "sap/ui/core/format/DateFormat",
  ],
  function (e, t, i, r, o, a, s, n, l, u) {
    "use strict";
    return e.extend("sap.ui.demo.orderbrowser.controller.Master", {
      formatter: l,
      onInit: function () {
        var e = this.byId("list"),
          t = this._createViewModel(),
          i = e.getBusyIndicatorDelay();
        this._oGroupFunctions = {
          CompanyName: function (e) {
            var t = e.getProperty("Customer/CompanyName");
            return { key: t, text: t };
          },
          OrderDate: function (e) {
            var t = e.getProperty("OrderDate"),
              i = t.getFullYear(),
              r = t.getMonth() + 1,
              o = this._oMonthNameFormat.format(t);
            return {
              key: i + "-" + r,
              text: this.getResourceBundle().getText(
                "masterGroupTitleOrderedInPeriod",
                [o, i]
              ),
            };
          }.bind(this),
          ShippedDate: function (e) {
            var t = e.getProperty("ShippedDate");
            if (t != null) {
              var i = t.getFullYear(),
                r = t.getMonth() + 1,
                o = this._oMonthNameFormat.format(t);
              return {
                key: i + "-" + r,
                text: this.getResourceBundle().getText(
                  "masterGroupTitleShippedInPeriod",
                  [o, i]
                ),
              };
            } else {
              return {
                key: 0,
                text: this.getResourceBundle().getText(
                  "masterGroupTitleNotShippedYet"
                ),
              };
            }
          }.bind(this),
        };
        this._oMonthNameFormat = u.getInstance({ pattern: "MMMM" });
        this._oList = e;
        this._oListFilterState = { aFilter: [], aSearch: [] };
        this.setModel(t, "masterView");
        e.attachEventOnce("updateFinished", function () {
          t.setProperty("/delay", i);
        });
        this.getView().addEventDelegate({
          onBeforeFirstShow: function () {
            this.getOwnerComponent().oListSelector.setBoundMasterList(e);
          }.bind(this),
        });
        this.getRouter()
          .getRoute("master")
          .attachPatternMatched(this._onMasterMatched, this);
        this.getRouter().attachBypassed(this.onBypassed, this);
      },
      onUpdateFinished: function (e) {
        this._updateListItemCount(e.getParameter("total"));
      },
      onSearch: function (e) {
        if (e.getParameters().refreshButtonPressed) {
          this.onRefresh();
          return;
        }
        var t = e.getParameter("query");
        if (t) {
          this._oListFilterState.aSearch = [
            new i("CustomerName", r.Contains, t),
          ];
        } else {
          this._oListFilterState.aSearch = [];
        }
        this._applyFilterSearch();
      },
      onRefresh: function () {
        this._oList.getBinding("items").refresh();
      },
      onOpenViewSettings: function (e) {
        var t = "filter";
        if (e.getSource().isA("sap.m.Button")) {
          var i = e.getSource().getId();
          if (i.match("sort")) {
            t = "sort";
          } else if (i.match("group")) {
            t = "group";
          }
        }
        if (!this._pViewSettingsDialog) {
          this._pViewSettingsDialog = n
            .load({
              id: this.getView().getId(),
              name: "sap.ui.demo.orderbrowser.view.ViewSettingsDialog",
              controller: this,
            })
            .then(
              function (e) {
                this.getView().addDependent(e);
                e.addStyleClass(
                  this.getOwnerComponent().getContentDensityClass()
                );
                return e;
              }.bind(this)
            );
        }
        this._pViewSettingsDialog.then(function (e) {
          e.open(t);
        });
      },
      onConfirmViewSettingsDialog: function (e) {
        var t = e.getParameter("filterItems"),
          o = [],
          a = [];
        t.forEach(function (e) {
          switch (e.getKey()) {
            case "Shipped":
              o.push(new i("ShippedDate", r.NE, null));
              break;
            case "NotShipped":
              o.push(new i("ShippedDate", r.EQ, null));
              break;
            default:
              break;
          }
          a.push(e.getText());
        });
        this._oListFilterState.aFilter = o;
        this._updateFilterBar(a.join(", "));
        this._applyFilterSearch();
        this._applyGrouper(e);
      },
      _applyGrouper: function (e) {
        var t = e.getParameters(),
          i,
          r,
          a = [];
        if (t.groupItem) {
          t.groupItem.getKey() === "CompanyName"
            ? (i = "Customer/" + t.groupItem.getKey())
            : (i = t.groupItem.getKey());
          r = t.groupDescending;
          var s = this._oGroupFunctions[t.groupItem.getKey()];
          a.push(new o(i, r, s));
        }
        this._oList.getBinding("items").sort(a);
      },
      onSelectionChange: function (e) {
        var t = e.getSource(),
          i = e.getParameter("selected");
        if (!(t.getMode() === "MultiSelect" && !i)) {
          this._showDetail(e.getParameter("listItem") || e.getSource());
        }
      },
      onBypassed: function () {
        this._oList.removeSelections(true);
      },
      createGroupHeader: function (e) {
        return new a({ title: e.text, upperCase: false });
      },
      _createViewModel: function () {
        return new t({
          isFilterBarVisible: false,
          filterBarLabel: "",
          delay: 0,
          titleCount: 0,
          noDataText: this.getResourceBundle().getText("masterListNoDataText"),
        });
      },
      _onMasterMatched: function () {
        this.getModel("appView").setProperty("/layout", "OneColumn");
      },
      _showDetail: function (e) {
        var t = !s.system.phone;
        this.getModel("appView").setProperty(
          "/layout",
          "TwoColumnsMidExpanded"
        );
        this.getRouter().navTo(
          "object",
          { objectId: e.getBindingContext().getProperty("OrderID") },
          t
        );
      },
      _updateListItemCount: function (e) {
        if (this._oList.getBinding("items").isLengthFinal()) {
          this.getModel("masterView").setProperty("/titleCount", e);
        }
      },
      _applyFilterSearch: function () {
        var e = this._oListFilterState.aSearch.concat(
            this._oListFilterState.aFilter
          ),
          t = this.getModel("masterView");
        this._oList.getBinding("items").filter(e, "Application");
        if (e.length !== 0) {
          t.setProperty(
            "/noDataText",
            this.getResourceBundle().getText(
              "masterListNoDataWithFilterOrSearchText"
            )
          );
        } else if (this._oListFilterState.aSearch.length > 0) {
          t.setProperty(
            "/noDataText",
            this.getResourceBundle().getText("masterListNoDataText")
          );
        }
      },
      _updateFilterBar: function (e) {
        var t = this.getModel("masterView");
        t.setProperty(
          "/isFilterBarVisible",
          this._oListFilterState.aFilter.length > 0
        );
        t.setProperty(
          "/filterBarLabel",
          this.getResourceBundle().getText("masterFilterBarText", [e])
        );
      },
    });
  }
);
