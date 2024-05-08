/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/search", "N/ui/serverWidget"], /**
 * @param {search} search
 * @param {serverWidget} serverWidget
 */ function (search, serverWidget) {
  const lineLevelObjects = [];
  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type
   * @param {Form} scriptContext.form - Current form
   * @Since 2015.2
   */
  function beforeLoad(scriptContext) {}

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function saveWholesalePrice(scriptContext) {
    var rec = scriptContext.newRecord;

    var wholesale_price;
    var customer_price_level;

    var customer = rec.getValue({ fieldId: "entity" });
    log.debug("customer--" + customer);
    var customer_fieldLookUp = search.lookupFields({
      type: search.Type.CUSTOMER,
      id: customer,
      columns: ["pricelevel", "custentity_discount_offered"],
    });
    if (customer_fieldLookUp.pricelevel.length > 0) {
      customer_price_level = customer_fieldLookUp.pricelevel[0].value;
      log.debug("customer_price_level--" + customer_price_level);
    }

    var wholesale_discount = customer_fieldLookUp.custentity_discount_offered;
    log.debug("wholesale_discount--" + wholesale_discount);
    if (wholesale_discount != "") {
      wholesale_discount = parseFloat(wholesale_discount) / 100;
      log.debug("wholesale_discount--" + wholesale_discount);
    } else {
      wholesale_discount = 0;
    }

    var lines = rec.getLineCount({
      sublistId: "item",
    });
    log.debug("lines", lines);
    for (var i = 0; i < lines; i++) {
      var wholesaleprice_calculated = rec.getSublistValue({
        sublistId: "item",
        fieldId: "custcol_wolesaleprice_calculated",
        line: i,
      });

      /* -------------------------- Latest Changes Begin 06/23/2020 -------------------------- */
      lineLevelObjects.push({
        line: i,
        amount: rec.getSublistValue({
          sublistId: "item",
          fieldId: "amount",
          line: i,
        }),
        rate: rec.getSublistValue({
          sublistId: "item",
          fieldId: "rate",
          line: i,
        }),
      });
      /* -------------------------- Latest Changes End 06/23/2020 -------------------------- */

      if (wholesaleprice_calculated == true) {
        continue;
      }

      if (customer_price_level != 2) {
        rec.setSublistValue({
          sublistId: "item",
          fieldId: "custcol_wolesaleprice_calculated",
          value: true,
          line: i,
          ignoreFieldChange: false,
        });
        continue;
      }
      var itemid = rec.getSublistValue({
        sublistId: "item",
        fieldId: "item",
        line: i,
      });
      log.debug("item--" + i, itemid);

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
        log.debug("wholesale_price--" + wholesale_price);
      });
      log.debug("wholesale_price1--" + wholesale_price);

      if (wholesale_price > 0) {
        var rate = wholesale_price - wholesale_price * wholesale_discount;
        rec.setSublistValue({
          sublistId: "item",
          fieldId: "rate",
          value: rate,
          line: i,
          ignoreFieldChange: false,
        });
        rec.setSublistValue({
          sublistId: "item",
          fieldId: "price",
          value: "-1",
          line: i,
          ignoreFieldChange: false,
        });
        rec.setSublistValue({
          sublistId: "item",
          fieldId: "custcol_wholesale_price",
          value: wholesale_price,
          line: i,
          ignoreFieldChange: false,
        });
        rec.setSublistValue({
          sublistId: "item",
          fieldId: "custcol_wolesaleprice_calculated",
          value: true,
          line: i,
          ignoreFieldChange: false,
        });
      } else {
        rec.setSublistValue({
          sublistId: "item",
          fieldId: "custcol_wolesaleprice_calculated",
          value: true,
          line: i,
          ignoreFieldChange: false,
        });
      }
    }
  }

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function afterSubmit(scriptContext) {
	  const salesOrderRec = scriptContext.newRecord;
	  
  }

  return {
    beforeSubmit: saveWholesalePrice,
  };
});
