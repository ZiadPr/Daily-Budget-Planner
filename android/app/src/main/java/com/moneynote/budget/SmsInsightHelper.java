package com.moneynote.budget;

import com.getcapacitor.JSObject;
import java.text.DecimalFormat;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SmsInsightHelper {

    private static final Pattern AMOUNT_PATTERN = Pattern.compile("\\b\\d+(?:[.,]\\d+)?\\b");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+20|0)?1[0125][0-9]{8}$");
    private static final Pattern URL_PATTERN = Pattern.compile("https?://|bit\\.ly|t\\.me", Pattern.CASE_INSENSITIVE);
    private static final Pattern BANK_PATTERN = Pattern.compile("bank|account|cib|nbe|qnb|instapay|fawry|wallet", Pattern.CASE_INSENSITIVE);
    private static final Pattern URGENCY_PATTERN = Pattern.compile("urgent|blocked|suspended|verify now|immediately", Pattern.CASE_INSENSITIVE);
    private static final Pattern CREDENTIAL_PATTERN = Pattern.compile("pin|otp|password|passcode|cvv", Pattern.CASE_INSENSITIVE);
    private static final Pattern INCOME_PATTERN = Pattern.compile("deposit|salary|received|credit|added", Pattern.CASE_INSENSITIVE);
    private static final Pattern EXPENSE_PATTERN = Pattern.compile("withdrawal|payment|purchase|paid|spent|debited", Pattern.CASE_INSENSITIVE);

    private static final List<String> VERIFIED_SENDERS = Arrays.asList(
        "cib",
        "nbe",
        "banquemisr",
        "qnb",
        "alexbank",
        "hsbc",
        "fawry",
        "instapay",
        "vfcash",
        "orangemoney",
        "vodafone",
        "orange",
        "etisalat",
        "we"
    );

    private SmsInsightHelper() {}

    public static JSObject buildEvent(String sender, String body) {
        String normalizedSender = sender == null || sender.trim().isEmpty() ? "Unknown" : sender.trim();
        String normalizedBody = body == null ? "" : body.trim();
        double amount = extractAmount(normalizedBody);
        String type = detectType(normalizedBody);
        String status = detectStatus(normalizedSender, normalizedBody);
        String reason = detectReason(normalizedSender, normalizedBody, status);
        long timestamp = System.currentTimeMillis();

        JSObject event = new JSObject();
        event.put("id", "sms-" + timestamp);
        event.put("sender", normalizedSender);
        event.put("body", normalizedBody);
        event.put("amount", amount);
        event.put("type", type);
        event.put("status", status);
        event.put("reason", reason);
        event.put("timestamp", timestamp);
        event.put("notificationTitle", "رسالة مالية جديدة • " + getStatusLabel(status));
        event.put("notificationBody", buildNotificationBody(normalizedSender, amount, status, type));
        return event;
    }

    private static double extractAmount(String body) {
        Matcher matcher = AMOUNT_PATTERN.matcher(body);
        if (!matcher.find()) {
            return 0;
        }

        try {
            return Double.parseDouble(matcher.group().replace(',', '.'));
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private static String detectType(String body) {
        if (INCOME_PATTERN.matcher(body).find()) {
            return "income";
        }

        if (EXPENSE_PATTERN.matcher(body).find()) {
            return "expense";
        }

        return "expense";
    }

    private static String detectStatus(String sender, String body) {
        String senderLower = sender.toLowerCase(Locale.ROOT);
        boolean isVerified = VERIFIED_SENDERS.contains(senderLower);
        boolean isPhoneNumber = PHONE_PATTERN.matcher(sender).matches();
        boolean hasUrl = URL_PATTERN.matcher(body).find();
        boolean mentionsBank = BANK_PATTERN.matcher(body).find();
        boolean hasUrgency = URGENCY_PATTERN.matcher(body).find();
        boolean asksCredentials = CREDENTIAL_PATTERN.matcher(body).find();

        if (isPhoneNumber && mentionsBank) {
            return "FRAUD";
        }

        if (hasUrl && mentionsBank) {
            return "FRAUD";
        }

        if (isVerified) {
            return "VERIFIED";
        }

        if (hasUrgency || asksCredentials) {
            return "SUSPICIOUS";
        }

        return "UNKNOWN";
    }

    private static String detectReason(String sender, String body, String status) {
        String senderLower = sender.toLowerCase(Locale.ROOT);

        if ("VERIFIED".equals(status)) {
            return "trusted_sender";
        }

        if (PHONE_PATTERN.matcher(sender).matches() && BANK_PATTERN.matcher(body).find()) {
            return "bank_from_phone";
        }

        if (URL_PATTERN.matcher(body).find() && BANK_PATTERN.matcher(body).find()) {
            return "suspicious_link";
        }

        if (URGENCY_PATTERN.matcher(body).find() || CREDENTIAL_PATTERN.matcher(body).find()) {
            return "urgent_language";
        }

        return VERIFIED_SENDERS.contains(senderLower) ? "trusted_sender" : "unrecognized_sender";
    }

    private static String buildNotificationBody(String sender, double amount, String status, String type) {
        StringBuilder builder = new StringBuilder();
        builder.append(sender);

        if (amount > 0) {
            builder.append(" • ").append(formatAmount(amount));
        }

        builder.append(" • ").append(getStatusLabel(status));
        builder.append(" • ").append("income".equals(type) ? "دخل" : "مصروف");
        return builder.toString();
    }

    private static String formatAmount(double amount) {
        DecimalFormat format = new DecimalFormat("#,##0.##");
        return format.format(amount);
    }

    private static String getStatusLabel(String status) {
        switch (status) {
            case "VERIFIED":
                return "موثوق";
            case "SUSPICIOUS":
                return "مريب";
            case "FRAUD":
                return "احتيال محتمل";
            default:
                return "غير معروف";
        }
    }
}
