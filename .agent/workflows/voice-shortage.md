---
description: How to use Voice Recognition for Shortage Recording  
---

# Voice Recognition for POS Shortage System

## Overview
The POS system now supports **Voice Commands** to add products to the shortage list without typing.

## Features

### 🎤 **Voice Recognition Button**
- **Blue Microphone Icon**: Click to start listening
- **Red Pulsing Icon**: Currently listening
- **Location**: In the search bar, next to the clear (X) button

### 🗣️ **How to Use**

#### Method 1: Direct Product Name
1. Click the microphone button (🎤)
2. Say the product name clearly in **Arabic or English**
   - Example (Arabic): "باراسيتامول"
   - Example (English): "Paracetamol"
3. System will:
   - Search for the product automatically
   - Add it to cart if found
   - Show success message

#### Method 2: Command Format
1. Click the microphone button
2. Use command format: **"سجل [product name]"** or **"أضف [product name]"**
   - Example: "سجل أسبرين"
   - Example: "أضف Aspirin"
3. System will extract the product name and search for it

### ✅ **System Behavior**

**If Product Found:**
- ✅ Automatically adds to cart
- ✅ Shows confirmation: "تم إضافة [product] إلى قائمة الفاقد"
- ✅ Quantity set to 1 (can be edited manually)

**If Product Not Found:**
- ⚠️ Opens Manual Entry form
- ⚠️ Pre-fills product name from voice
- ⚠️ Pharmacist can complete price and agent manually

### 🌐 **Browser Support**
- ✅ **Chrome** (Recommended)
- ✅ **Edge** (Recommended)
- ✅ **Safari** (Limited support)
- ❌ **Firefox** (Not supported)

### 📝 **Tips for Best Results**
1. **Speak clearly** and at normal pace
2. **Minimize background noise**
3. **Use Arabic (Bahraini)** or **English**
4. **Say full product names** (avoid abbreviations)
5. For **agent names**, include in command: "سجل أسبرين من Gulf Pharmacy"

### 🔧 **Technical Details**
- Uses **Web Speech API** (webkit)
- Language: `ar-BH` (Arabic - Bahrain)
- Also detects English product names
- Real-time transcript display while listening

### ⚡ **Quick Example Workflow**
```
1. Pharmacist: [Clicks mic button] 🎤
2. System: "جاري الاستماع..." (Listening animation)
3. Pharmacist: "باندول"
4. System: Searches products → Finds "Panadol" → Adds to cart
5. Alert: "تم إضافة Panadol إلى قائمة الفاقد" ✅
```

### 🚨 **Error Handling**
- If mic permission denied: Request browser permission
- If speech not recognized: Alert shown, try again
- If browser unsupported: Alert with instructions

---

**Last Updated**: 2026-01-25
**Feature Version**: 1.0
