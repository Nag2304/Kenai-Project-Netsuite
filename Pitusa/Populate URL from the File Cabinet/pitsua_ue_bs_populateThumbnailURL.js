/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/search"], (search) => {
  const exports = {};
  /* ------------------------ Before Submit Begin ------------------------ */
  function beforeSubmit(scriptContext) {
    const newRecord = scriptContext.newRecord;

    const newLineCount = newRecord.getLineCount({ sublistId: "item" });

    let totalQty = 0;

    for (let i = 0; i < newLineCount; i++) {
      try {
        const itemId = newRecord.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: i,
        });

        const itemType = newRecord.getSublistValue({
          sublistId: "item",
          fieldId: "itemtype",
          line: i,
        });

        let quantity = newRecord.getSublistValue({
          sublistId: "item",
          fieldId: "quantity",
          line: i,
        });

        if (quantity) {
          totalQty += quantity;
        }

        if (itemType === "InvtPart") {
          let url = search.lookupFields({
            type: search.Type.INVENTORY_ITEM,
            id: itemId,
            columns: ["custitem_atlas_item_image"],
          }).custitem_atlas_item_image[0];

          if (url?.text) {
            let newURL = url.text;
            const imageURL = `https://system.netsuite.com/${newURL}`;
            newRecord.setSublistValue({
              sublistId: "item",
              fieldId: "custcol_pitusa_thumbnail_url",
              value: imageURL,
              line: i,
            });
          }
        }
      } catch (err) {
        log.error("Error Details", err);
      }
    }
    //log.debug("type", newRecord);
    if (totalQty && newRecord.type === "salesorder") {
      newRecord.setValue({
        fieldId: "custbody_pitusa_orderqty",
        value: totalQty,
      });
    }
  }
  /* ------------------------ Before Submit End ------------------------ */
  //
  /* ------------------------ Exports Begin ------------------------ */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------ Exportst End ------------------------ */
});
