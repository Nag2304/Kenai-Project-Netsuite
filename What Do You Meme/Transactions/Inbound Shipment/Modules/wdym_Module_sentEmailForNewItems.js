/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: wdym_Module_sentEmailForNewItems.js
 * Author           Date       Version               Remarks
 * nagendrababu  31st Aug 2024 1.00           Initial Creation of script.
 *
 */

/* global define,log */

define(['N/record', 'N/email', 'N/search', 'N/runtime'], (
  record,
  email,
  search,
  runtime
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* -------------------- Sent Email for New Items - Begin -------------------- */
  /**
   *
   * @param {object} context
   */
  const sentNewEmailForNewItems = (context) => {
    const loggerTitle = 'Sent New Email For New Items';
    log.debug(loggerTitle, '|>------------------- Entry -------------------<|');

    try {
      const inboundShipmentRecord = context.newRecord;
      const itemCount = inboundShipmentRecord.getLineCount({
        sublistId: 'item',
      });

      const { userAddress, recipientEmail } = getScriptParameters();

      let newItemFound = false;
      let emailTableContent = '';
      let approvalDate = '';

      for (let i = 0; i < itemCount; i++) {
        const itemId = inboundShipmentRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: i,
        });
        const itemFields = getItemFields(itemId);

        if (itemFields.custitem_wdym_new_item) {
          newItemFound = true;
          approvalDate = getCLevelApprovalDate(itemId);
          emailTableContent += generateEmailTableRow(itemFields);

          updateNewItemField(itemId);
        }
      }

      if (newItemFound) {
        sendEmail(userAddress, recipientEmail, approvalDate, emailTableContent);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }

    log.debug(loggerTitle, '|>------------------- Exit -------------------<|');
  };
  /* -------------------- Sent Email for New Items - End -------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  //
  /* *********************** Get Script Parameters - Begin *********************** */
  const getScriptParameters = () => {
    const loggerTitle = 'Get Script Parameters';
    log.debug(loggerTitle, '|>------------------- Entry -------------------<|');
    //
    let userAddress = '';
    let recipientEmail = '';
    try {
      const scriptObj = runtime.getCurrentScript();
      userAddress = scriptObj.getParameter({
        name: 'custscript_wdym_user_addr',
      });
      recipientEmail = scriptObj.getParameter({
        name: 'custscript_wdym_rec_email',
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    log.debug(
      loggerTitle,
      `User Addres: ${userAddress} To Email: ${recipientEmail}`
    );
    //
    log.debug(loggerTitle, '|>------------------- Exit -------------------<|');
    return { userAddress, recipientEmail };
  };
  /* *********************** Get Script Parameters - End *********************** */
  //
  /* *********************** Get Item Fields - Begin *********************** */
  /**
   *
   * @param {Number} itemId
   * @returns {Object}
   */
  const getItemFields = (itemId) => {
    const loggerTitle = `Get Item Fields for Item ID: ${itemId}`;
    log.debug(loggerTitle, '|>------------------- Entry -------------------<|');

    try {
      log.debug(loggerTitle, ' Item ID: ' + itemId);
      //
      return search.lookupFields({
        type: 'item',
        id: itemId,
        columns: ['custitem_wdym_new_item', 'itemid', 'displayname'],
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }

    log.debug(loggerTitle, '|>------------------- Exit -------------------<|');
  };
  /* *********************** Get Item Fields - End *********************** */
  //
  /* *********************** Get C-Level Approval Date - Begin *********************** */
  /**
   *
   * @param {Number} itemId
   * @returns
   */
  const getCLevelApprovalDate = (itemId) => {
    const loggerTitle = `Get C-Level Approval Date for Item ID: ${itemId}`;
    log.debug(loggerTitle, '|>------------------- Entry -------------------<|');

    try {
      const approvalDateSearch = search.create({
        type: 'item',
        filters: [
          ['internalidnumber', 'equalto', itemId],
          'AND',
          ['systemnotes.field', 'anyof', 'CUSTITEM_WDYM_CLEVEL_APPROVED'],
          'AND',
          ['systemnotes.newvalue', 'is', 'T'],
          'AND',
          ['systemnotes.type', 'is', 'F'],
        ],
        columns: [
          search.createColumn({
            name: 'date',
            join: 'systemNotes',
            label: 'Date',
          }),
        ],
      });

      const searchResultCount = approvalDateSearch.runPaged().count;
      log.debug(loggerTitle, 'Search Result Count: ' + searchResultCount);
      //
      const approvalDateResult = approvalDateSearch
        .run()
        .getRange({ start: 0, end: 1 });

      return approvalDateResult.length > 0
        ? approvalDateResult[0].getValue({
            name: 'date',
            join: 'systemNotes',
            label: 'Date',
          })
        : 'N/A';
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }

    log.debug(loggerTitle, '|>------------------- Exit -------------------<|');
  };
  /* *********************** Get C-Level Approval Date - End *********************** */
  //
  /* *********************** Generate Email Table Row - Begin *********************** */
  /**
   *
   * @param {object} itemFields
   * @returns
   */
  const generateEmailTableRow = (itemFields) => {
    const loggerTitle = 'Generate Email Table Row';
    log.debug(loggerTitle, '|>------------------- Entry -------------------<|');

    try {
      return `
            <tr>
                <td>${itemFields.itemid}</td>
                <td>${itemFields.displayname}</td>
            </tr>`;
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }

    log.debug(loggerTitle, '|>------------------- Exit -------------------<|');
  };
  /* *********************** Generate Email Table Row - End *********************** */
  //
  /* *********************** Update New Item Field - Begin *********************** */
  /**
   *
   * @param {Number} itemId
   */
  const updateNewItemField = (itemId) => {
    const loggerTitle = `Update New Item Field for Item ID: ${itemId}`;
    log.debug(loggerTitle, '|>------------------- Entry -------------------<|');

    try {
      record.submitFields({
        type: record.Type.ITEM,
        id: itemId,
        values: { custitem_wdym_new_item: false },
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }

    log.debug(loggerTitle, '|>------------------- Exit -------------------<|');
  };
  /* *********************** Update New Item Field - End *********************** */
  //
  /* *********************** Send Email -Begin *********************** */
  const sendEmail = (
    userAddress,
    recipientEmail,
    approvalDate,
    emailTableContent
  ) => {
    const loggerTitle = 'Send Email';
    log.debug(loggerTitle, '|>------------------- Entry -------------------<|');

    try {
      const emailTemplate = record.load({
        type: record.Type.EMAIL_TEMPLATE,
        id: '7',
      });

      let emailContent = emailTemplate.getValue({ fieldId: 'content' });
      emailContent = emailContent.replace('{approvaldate}', approvalDate);
      emailContent += `
            <table border="1" cellpadding="5" cellspacing="0" width="100%">
                <thead>
                    <tr>
                        <th>Item No</th>
                        <th>Item Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${emailTableContent}
                </tbody>
            </table>
        `;

      email.send({
        author: parseInt(userAddress),
        recipients: recipientEmail,
        subject: emailTemplate.getValue({ fieldId: 'subject' }),
        body: emailContent,
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }

    log.debug(loggerTitle, '|>------------------- Exit -------------------<|');
  };
  /* *********************** Send Email -End *********************** */
  //

  /* ------------------------ Helper Functions - End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = sentNewEmailForNewItems;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
