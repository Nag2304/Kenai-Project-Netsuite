/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/email', 'N/runtime', 'N/url', 'N/record'], function (
  email,
  runtime,
  url,
  record
) {
  const exports = {};
  /* ---------------------------- Before Submit Begin --------------------------- */
  function beforeSubmit(context) {
    if (context.type === context.UserEventType.CREATE) {
      var rec = context.newRecord;
      const tagValues = [];
      var lineItemCount = rec.getLineCount({ sublistId: 'item' });

      for (var i = 0; i < lineItemCount; i++) {
        var tagsUsed = rec.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_tags_used',
          line: i,
        });
        if (tagsUsed) {
          tagValues.push(tagsUsed);
        }
      }

      log.debug({
        title: 'values-BS',
        details: [tagValues],
      });
      if (tagValues.length > 0) {
        //
        /* ------------------------ Retrieve Record URL Begin ----------------------- */
        var scheme = 'https://';
        var host = url.resolveDomain({
          hostType: url.HostType.APPLICATION,
        });
        var relativePath = url.resolveRecord({
          recordType: record.Type.PURCHASE_ORDER,
          recordId: rec.id,
          isEditMode: false,
        });
        var myURL = scheme + host + relativePath;
        /* ------------------------ Retrieve Record URL End ----------------------- */
        //
        var scriptObj = runtime.getCurrentScript();
        var subject = scriptObj.getParameter({
          name: 'custscript_dm_emailsubject',
        });
        var body = scriptObj.getParameter({
          name: 'custscript_dm_emailbody',
        });
        body += `
        Please go through the below URL.
        ${myURL}
        `;
        email.send({
          author: runtime.getCurrentUser().id,
          recipients: 'cody@deltamillworks.com',
          subject: subject,
          body: body,
        });
      }
    }
  }
  /* ---------------------------- Before Submit End --------------------------- */
  //
  /* ---------------------------- After Submit Begin --------------------------- */
  function afterSubmit(context) {
    if (context.type !== context.UserEventType.CREATE) {
      var oldRec = context.oldRecord;
      var newRec = context.newRecord;
      var sendEmailFlag = 'N';
      const oldRecTagValues = [];
      const newRecTagValues = [];
      /* ---------------------------- Old Record Begin ---------------------------- */
      var oldLineItemCount = oldRec.getLineCount({ sublistId: 'item' });
      if (oldLineItemCount) {
        for (var i = 0; i < oldLineItemCount; i++) {
          oldRecTagValues.push(
            oldRec.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_tags_used',
              line: i,
            })
          );
        }
      }
      /* ----------------------------- Old Record End ----------------------------- */
      //
      /* ---------------------------- New Record Begin ---------------------------- */
      var newLineItemCount = newRec.getLineCount({ sublistId: 'item' });
      if (newLineItemCount) {
        for (var j = 0; j < newLineItemCount; j++) {
          newRecTagValues.push(
            newRec.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_tags_used',
              line: j,
            })
          );
        }
      }
      /* ----------------------------- New Record End ----------------------------- */
      //
      log.debug({
        title: 'values',
        details: [oldRecTagValues, newRecTagValues],
      });
      if (oldRecTagValues.length === newRecTagValues.length) {
        for (var k = 0; k < oldRecTagValues.length; k++) {
          if (oldRecTagValues[k] !== newRecTagValues[k]) {
            sendEmailFlag = 'Y';
            break;
          }
        }
      } else if (newRecTagValues.length > oldRecTagValues.length) {
        if (
          newRecTagValues[newRecTagValues.length - 1] !== null ||
          newRecTagValues[newRecTagValues.length - 1] !== undefined
        ) {
          sendEmailFlag = 'Y';
        }
      }
      log.debug({ title: 'Send Email Flag', details: sendEmailFlag });
      /* ---------------------------- Send Email Begin ---------------------------- */
      if (sendEmailFlag === 'Y') {
        //
        /* ------------------------ Retrieve Record URL Begin ----------------------- */
        var scheme = 'https://';
        var host = url.resolveDomain({
          hostType: url.HostType.APPLICATION,
        });
        var relativePath = url.resolveRecord({
          recordType: record.Type.PURCHASE_ORDER,
          recordId: newRec.id,
          isEditMode: false,
        });
        var myURL = scheme + host + relativePath;
        /* ------------------------ Retrieve Record URL End ----------------------- */
        //
        var scriptObj = runtime.getCurrentScript();
        var subject = scriptObj.getParameter({
          name: 'custscript_dm_emailsubject',
        });
        var body = scriptObj.getParameter({
          name: 'custscript_dm_emailbody',
        });
        body += `
        Please go through the below URL.
        ${myURL}
        `;
        email.send({
          author: runtime.getCurrentUser().id,
          recipients: 'cody@deltamillworks.com',
          subject: subject,
          body: body,
        });
      }
      /* ----------------------------- Send Email End ----------------------------- */
    }
  }
  /* ---------------------------- After Submit End --------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
