/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Francisco Alvarado Ferllini
 * @contact contact@midware.net
 */
define([
  'require',
  'exports',
  'N/log',
  'N/https',
  'N/url',
  'N/ui/dialog',
  '../Constants/Constants',
], function (require, exports, log, https, url, dialog, constants) {
  Object.defineProperty(exports, '__esModule', { value: true });
  function pageInit(pContext) {
    try {
      jQuery('#custpage_mw_message_data').val(JSON.stringify({}));
      // addSpacer('tbl_custpage_send_mesage_button');
    } catch (error) {
      handleError(error);
    }
  }
  exports.pageInit = pageInit;
  // function addSpacer(pButtonId){
  //     let spacerLogic = `<td><table border="0" cellpadding="0" cellspacing="0" class="uir-button-menu-divider" style="margin-right:20%;" role="presentation"><tbody><tr><td></td></tr></tbody></table></td>`
  //     jQuery(document.getElementById(pButtonId).parentElement).before(`${spacerLogic}`);
  // }
  function buttonAction(pAppointmentId) {
    if (pAppointmentId) {
      var getOptionsURL = url.resolveScript({
        scriptId: constants.SUITELET.SCRITP_ID,
        deploymentId: constants.SUITELET.DEPLOYMENT_ID,
        params: {
          method: constants.SUITELET.METODS.getOptions,
          appointmentid: pAppointmentId,
        },
      });
      console.log(getOptionsURL);
      https.get
        .promise({
          url: getOptionsURL,
        })
        .then(function (pResult) {
          console.log('Request finished.');
          // console.log('Test'+pResult.body)
          // let getAnswers = JSON.parse(pResult.body);
          // if (!getAnswers.status) {
          var buttonSend = {
            label: 'Send',
            value: 0,
          };
          var buttonCancel = {
            label: 'Cancel',
            value: 1,
          };
          var popup = dialog.create({
            title: 'Send Message',
            message: pResult.body,
            buttons: [buttonSend, buttonCancel],
          });
          popup
            .then(function (result) {
              if (Number(result) == 0) {
                var messageData = jQuery('#custpage_mw_message_data').val();
                var messageDataJSON = JSON.parse(messageData);
                var message = messageDataJSON.message;
                var phone = messageDataJSON.phone;
                var recipient = messageDataJSON.recipient
                  ? messageDataJSON.recipient
                  : null;
                console.log(message);
                console.log(jQuery('#custpage_mw_message_data').val());
                if (phone) {
                  if (message) {
                    if (CheckPhoneLen(phone))
                      sendMessage(phone, message, recipient, pAppointmentId);
                    else
                      dialog.create({
                        title: 'ERROR',
                        message: 'The Recipient Number Must Have 10 Digits.',
                      });
                  } else
                    dialog.create({
                      title: 'ERROR',
                      message: 'Message Not Found.',
                    });
                } else
                  dialog.create({
                    title: 'ERROR',
                    message: 'Recipient Number Not Found.',
                  });
              }
              jQuery('#custpage_mw_message_data').val(JSON.stringify({}));
            })
            .catch(function (pError) {
              console.log('dialog finished with error: ' + pError.message);
            });
          // }
          // else console.log(`Request finished with error: ${getAnswers.message}`);
        })
        .catch(function (pError) {
          console.log('Request finished with error: ' + pError.message);
        });
    } else
      dialog.create({ title: 'ERROR', message: 'Appointment Id Not Found' });
  }
  exports.buttonAction = buttonAction;
  function sendMessage(pPhone, pMessage, pRecipient, pAppointmentId) {
    var sendMessageURL = url.resolveScript({
      scriptId: constants.SUITELET.SCRITP_ID,
      deploymentId: constants.SUITELET.DEPLOYMENT_ID,
      params: {
        method: constants.SUITELET.METODS.sendMessage,
      },
    });
    https.post
      .promise({
        url: sendMessageURL,
        body: {
          phone: pPhone,
          message: pMessage,
          recipient: pRecipient,
          appointment: pAppointmentId,
        },
      })
      .then(function (pResult) {
        console.log('Request finished.');
        console.log(pResult.body);
        var getAnswers = JSON.parse(pResult.body);
        if (!getAnswers.status)
          dialog.create({
            title: 'Message',
            message: 'Message Successfully Sent',
          });
        else dialog.create({ title: 'ERROR', message: getAnswers.message });
      })
      .catch(function (pError) {
        console.log('Request finished with error: ' + pError.message);
      });
  }
  exports.sendMessage = sendMessage;
  function CheckPhoneLen(pPhone) {
    var newPhone = pPhone
      .replace(/\s+/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/[^0-9+]/g, '');
    newPhone = newPhone.substring(newPhone.length - 10, newPhone.length);
    return newPhone.length == 10;
  }
  function handleError(pError) {
    log.error({ title: 'Error', details: pError.message });
    log.error({ title: 'Stack', details: JSON.stringify(pError) });
  }
});
