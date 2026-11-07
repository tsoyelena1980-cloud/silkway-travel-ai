# Финансы, Расчёт Квот и Маржинальности (Travel Agency AI)

## Формулы расчёта (в целых узбекских сумах — UZS BIGINT)
- **Себестоимость поставщика (Supplier Net Cost UZS):** сумма нетто-затрат (отели, ж/д билеты Afrosiyob, гиды, трансферы, входные билеты).
- **Наценка агентства (Markup UZS):** добавленная стоимость поверх себестоимости.
- **Цена до скидки (Gross Selling Price UZS):** `Cost + Markup`.
- **Скидка клиенту (Discount UZS):** согласованная сумма скидки.
- **Итоговая цена для клиента (Final Client Price UZS):** `Gross Selling Price - Discount`.
- **Валовая прибыль (Gross Profit UZS):** `Final Client Price - Supplier Net Cost`.
- **Валовая маржа (Gross Margin %):** `(Gross Profit / Final Client Price) * 100`.
- **Комиссия платёжного шлюза (Payme / Click / Uzum Fee UZS):** процент эквайринга (например, 1.5% – 2.0%).
- **Чистая операционная прибыль (Net Profit UZS):** `Gross Profit - Payment Processing Fee`.
