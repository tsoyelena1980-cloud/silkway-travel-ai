#!/usr/bin/env python3
"""Reproducible Tour Quote & Margin Calculator (UZS integer precision)."""
import json
import sys


def calculate_quote(cost_uzs: int, markup_percent: float, discount_uzs: int = 0, gateway_fee_percent: float = 1.5) -> dict:
    cost_uzs = int(round(cost_uzs))
    discount_uzs = int(round(discount_uzs))
    markup_uzs = int(round(cost_uzs * (markup_percent / 100.0)))
    gross_price_uzs = cost_uzs + markup_uzs
    final_price_uzs = max(cost_uzs, gross_price_uzs - discount_uzs)
    gross_profit_uzs = final_price_uzs - cost_uzs
    gross_margin_pct = round((gross_profit_uzs / final_price_uzs) * 100.0, 2) if final_price_uzs > 0 else 0.0
    processing_fee_uzs = int(round(final_price_uzs * (gateway_fee_percent / 100.0)))
    net_profit_uzs = gross_profit_uzs - processing_fee_uzs

    return {
        "currency": "UZS",
        "supplier_cost_uzs": cost_uzs,
        "markup_uzs": markup_uzs,
        "discount_uzs": discount_uzs,
        "final_client_price_uzs": final_price_uzs,
        "gross_profit_uzs": gross_profit_uzs,
        "gross_margin_percent": gross_margin_pct,
        "payment_fee_uzs": processing_fee_uzs,
        "net_profit_uzs": net_profit_uzs,
    }


if __name__ == "__main__":
    cost = int(sys.argv[1]) if len(sys.argv) > 1 else 8000000
    markup = float(sys.argv[2]) if len(sys.argv) > 2 else 18.0
    discount = int(sys.argv[3]) if len(sys.argv) > 3 else 300000
    print(json.dumps(calculate_quote(cost, markup, discount), ensure_ascii=False, indent=2))
