/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/ui", "N/search"], /**
 * @param {ui} ui
 * @param {serverWidget} serverWidget
 */ function (ui, search) {
  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
   *
   * @since 2015.2
   */
  function pageInit(scriptContext) {}

  /**
   * Function to be executed when field is changed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
   *
   * @since 2015.2
   */
  function fieldChanged(scriptContext) {
    var wholesale_price;
    var customer_price_level;
    var fieldid = scriptContext.fieldId;
    var sublist_id = scriptContext.sublistId;
    var rec = scriptContext.currentRecord;
    console.log("fieldid--" + fieldid);

    if (sublist_id == "item" && fieldid == "item") {
      var customer = rec.getValue({ fieldId: "entity" });
      console.log("customer--" + customer);
      var customer_fieldLookUp = search.lookupFields({
        type: search.Type.CUSTOMER,
        id: customer,
        columns: ["pricelevel"],
      });
      if (customer_fieldLookUp.pricelevel.length > 0) {
        customer_price_level = customer_fieldLookUp.pricelevel[0].value;
        console.log("customer_price_level--" + customer_price_level);
        if (customer_price_level != 2) return;
      } else {
        return;
      }

      var wholesale_discount = customer_fieldLookUp.custentity_discount_offered;
      console.log("wholesale_discount--" + wholesale_discount);
      var itemid = rec.getCurrentSublistValue({
        sublistId: sublist_id,
        fieldId: "item",
      });
      if (itemid > 0) {
        var itemSearchObj = search.create({
          type: "item",
          filters: [
            ["internalidnumber", "equalto", itemid],
            "AND",
            ["pricing.currency", "anyof", "1"],
            "AND",
            ["pricing.pricelevel", "anyof", "2"],
          ],
          columns: [
            search.createColumn({ name: "itemid", label: "Name" }),
            search.createColumn({
              name: "currency",
              join: "pricing",
              label: "Currency",
            }),
            search.createColumn({
              name: "internalid",
              join: "pricing",
              label: "Internal ID",
            }),
            search.createColumn({
              name: "pricelevel",
              join: "pricing",
              label: "Price Level",
            }),
            search.createColumn({
              name: "quantityrange",
              join: "pricing",
              label: "Quantity Range",
            }),
            search.createColumn({
              name: "saleunit",
              join: "pricing",
              label: "Sale Unit",
            }),
            search.createColumn({
              name: "unitprice",
              join: "pricing",
              label: "Unit Price",
            }),
          ],
        });
        var searchResultCount = itemSearchObj.runPaged().count;
        log.debug("itemSearchObj result count", searchResultCount);
        itemSearchObj.run().each(function (result) {
          wholesale_price = result.getValue({
            name: "unitprice",
            join: "pricing",
            label: "Unit Price",
          });
          console.log("wholesale_price--" + wholesale_price);
        });
        console.log("wholesale_price1--" + wholesale_price);
        if (wholesale_price) {
          rec.setCurrentSublistValue({
            sublistId: sublist_id,
            fieldId: "custcol_wholesale_price",
            value: wholesale_price,
            ignoreFieldChange: false,
          });
          rec.setCurrentSublistValue({
            sublistId: sublist_id,
            fieldId: "price",
            value: "-1",
            ignoreFieldChange: true,
          });
          if (wholesale_price > 0) {
            rec.setCurrentSublistValue({
              sublistId: sublist_id,
              fieldId: "rate",
              value: wholesale_price,
              ignoreFieldChange: false,
            });
          }
        }
      } else {
        rec.setCurrentSublistValue({
          sublistId: sublist_id,
          fieldId: "custcol_wholesale_price",
          value: "",
          ignoreFieldChange: false,
        });
      }
    }
  }

  /**
   * Function to be executed when field is slaved.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   *
   * @since 2015.2
   */
  function postSourcing(scriptContext) {}

  /**
   * Function to be executed after sublist is inserted, removed, or edited.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @since 2015.2
   */
  function sublistChanged(scriptContext) {
    console.log("sublist changed");
    var rec = scriptContext.currentRecord;
    var wholesale_price;
    var wholesale_discount;
    var sublist_id = scriptContext.sublistId;

    console.log("sublistId--" + sublist_id);

    var wholesaleprice_calculated = rec.getCurrentSublistValue({
      sublistId: sublist_id,
      fieldId: "custcol_wolesaleprice_calculated",
    });
    console.log("wholesaleprice_calculated--" + wholesaleprice_calculated);

    if (wholesaleprice_calculated == true) return true;

    var itemid = rec.getCurrentSublistValue({
      sublistId: sublist_id,
      fieldId: "item",
    });
    console.log("itemid--" + itemid);

    if (itemid == "" || itemid == null || itemid == "NaN") return;

    var itemSearchObj = search.create({
      type: "item",
      filters: [
        ["internalidnumber", "equalto", itemid],
        "AND",
        ["pricing.currency", "anyof", "1"],
        "AND",
        ["pricing.pricelevel", "anyof", "2"],
      ],
      columns: [
        search.createColumn({ name: "itemid", label: "Name" }),
        search.createColumn({
          name: "currency",
          join: "pricing",
          label: "Currency",
        }),
        search.createColumn({
          name: "internalid",
          join: "pricing",
          label: "Internal ID",
        }),
        search.createColumn({
          name: "pricelevel",
          join: "pricing",
          label: "Price Level",
        }),
        search.createColumn({
          name: "quantityrange",
          join: "pricing",
          label: "Quantity Range",
        }),
        search.createColumn({
          name: "saleunit",
          join: "pricing",
          label: "Sale Unit",
        }),
        search.createColumn({
          name: "unitprice",
          join: "pricing",
          label: "Unit Price",
        }),
      ],
    });
    var searchResultCount = itemSearchObj.runPaged().count;
    log.debug("itemSearchObj result count", searchResultCount);
    itemSearchObj.run().each(function (result) {
      wholesale_price = result.getValue({
        name: "unitprice",
        join: "pricing",
        label: "Unit Price",
      });
      console.log("wholesale_price--" + wholesale_price);
    });

    console.log("wholesale_price--" + wholesale_price);
    if (
      wholesale_price == "" ||
      wholesale_price == null ||
      wholesale_price == "NaN"
    )
      return true;

    var customer = rec.getValue({ fieldId: "entity" });
    var customer_fieldLookUp = search.lookupFields({
      type: search.Type.CUSTOMER,
      id: customer,
      columns: ["custentity_discount_offered"],
    });
    wholesale_discount = customer_fieldLookUp.custentity_discount_offered;
    console.log("wholesale_discount--" + wholesale_discount);
    if (wholesale_discount != "") {
      wholesale_discount = parseFloat(wholesale_discount) / 100;
      console.log("wholesale_discount--" + wholesale_discount);
    } else {
      wholesale_discount = 0;
    }

    var rate = wholesale_price - wholesale_price * wholesale_discount;
    var lineno = rec.getCurrentSublistIndex({ sublistId: "item" });
    console.log("lineno " + lineno);

    rec.setCurrentSublistValue({
      sublistId: "item",
      fieldId: "price",
      value: "-1",
      ignoreFieldChange: false,
    });
    rec.setCurrentSublistValue({
      sublistId: sublist_id,
      fieldId: "custcol_wholesale_price",
      value: wholesale_price,
      ignoreFieldChange: false,
    });
    rec.setCurrentSublistValue({
      sublistId: "item",
      fieldId: "rate",
      value: rate,
      ignoreFieldChange: false,
    });
    rec.setCurrentSublistValue({
      sublistId: "item",
      fieldId: "custcol_wolesaleprice_calculated",
      value: true,
      ignoreFieldChange: false,
    });
    rec.commitLine({ sublistId: "item" });
  }

  /**
   * Function to be executed after line is selected.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @since 2015.2
   */
  function lineInit(scriptContext) {
    var rec = scriptContext.currentRecord;
    rec.setCurrentSublistValue({
      sublistId: "item",
      fieldId: "custcol_wolesaleprice_calculated",
      value: false,
      ignoreFieldChange: true,
    });
  }

  /**
   * Validation function to be executed when field is changed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
   *
   * @returns {boolean} Return true if field is valid
   *
   * @since 2015.2
   */
  function validateField(scriptContext) {}

  /**
   * Validation function to be executed when sublist line is committed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateLine(scriptContext) {
    var rec = scriptContext.currentRecord;
    var wholesale_price;
    var wholesale_discount;
    var currentPrice;

    wholesale_price = rec.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "custcol_wholesale_price",
    });
    currentPrice = rec.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "rate",
    });

    console.log("wholesale_price--" + wholesale_price);
    if (
      wholesale_price == "" ||
      wholesale_price == null ||
      wholesale_price == "NaN"
    ) {
      rec.setCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcol_wolesaleprice_calculated",
        value: true,
        ignoreFieldChange: false,
      });
      return true;
    }

    var customer = rec.getValue({ fieldId: "entity" });
    var customer_fieldLookUp = search.lookupFields({
      type: search.Type.CUSTOMER,
      id: customer,
      columns: ["custentity_discount_offered"],
    });
    wholesale_discount = customer_fieldLookUp.custentity_discount_offered;
    console.log("wholesale_discount--" + wholesale_discount);
    if (wholesale_discount != "") {
      wholesale_discount = parseFloat(wholesale_discount) / 100;
      console.log("wholesale_discount--" + wholesale_discount);
    } else {
      wholesale_discount = 0;
    }

    wholesale_price = wholesale_price - wholesale_price * wholesale_discount;
    rec.setCurrentSublistValue({
      sublistId: "item",
      fieldId: "price",
      value: "-1",
      ignoreFieldChange: false,
    });

    /* ---------------------- Changes Done Today 06/23/2020  Begin  --------------------- */
    log.debug({ title: "Current Price", details: currentPrice });

    if (currentPrice !== wholesale_price) {
      rec.setCurrentSublistValue({
        sublistId: "item",
        fieldId: "rate",
        value: currentPrice,
        ignoreFieldChange: false,
      });
    } else {
      rec.setCurrentSublistValue({
        sublistId: "item",
        fieldId: "rate",
        value: wholesale_price,
        ignoreFieldChange: false,
      });
    }
    /* ---------------------- Changes Done Today 06/23/2020  End --------------------- */
    rec.setCurrentSublistValue({
      sublistId: "item",
      fieldId: "custcol_wolesaleprice_calculated",
      value: true,
      ignoreFieldChange: false,
    });
    return true;
  }

  /**
   * Validation function to be executed when sublist line is inserted.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateInsert(scriptContext) {}

  /**
   * Validation function to be executed when record is deleted.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateDelete(scriptContext) {}

  /**
   * Validation function to be executed when record is saved.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @returns {boolean} Return true if record is valid
   *
   * @since 2015.2
   */
  function saveRecord(scriptContext) {}

  return {
    fieldChanged: fieldChanged,
    validateLine: validateLine,
    //        sublistChanged:sublistChanged,
    lineInit: lineInit,
  };
});
