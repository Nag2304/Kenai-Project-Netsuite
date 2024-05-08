/**
 * @author Midware
 * @developer Francisco Alvarado Ferllini
 * @contact contact@midware.net
 */
define([
  'require',
  'exports',
  'N/log',
  '../Views/SendTextMessageFromInquiryView',
  '../Models/SendTextMessageFromInquiryModel',
], function (require, exports, log, view, model) {
  Object.defineProperty(exports, '__esModule', { value: true });
  function getOptions(pParamters) {
    var appointmentId = pParamters.appointmentid;
    var appointmentdata = model.getAppointmentContacts(appointmentId);
    log.debug('appointmentdata', appointmentdata);
    if (!appointmentdata.status)
      return view.getOptionsView(appointmentdata.contacts);
    else return appointmentdata.message;
  }
  exports.getOptions = getOptions;
  function sendMessage(pParamters) {
    var phone = pParamters.phone;
    var message = pParamters.message;
    var recipient = pParamters.recipient;
    var appointment = pParamters.appointment;
    log.debug('controller.sendMessage phone', phone);
    log.debug('controller.sendMessage message', message);
    log.debug('controller.sendMessage recipient', recipient);
    log.debug('controller.sendMessage appointment', appointment);
    try {
      var textMagicUsers = model.getFreeLogin();
      return model.sendMessage(
        textMagicUsers,
        message,
        phone,
        recipient,
        appointment
      );
    } catch (error) {
      log.error('controller.sendMessage ', error.message);
      return { status: true, message: error.message };
    }
  }
  exports.sendMessage = sendMessage;
});
