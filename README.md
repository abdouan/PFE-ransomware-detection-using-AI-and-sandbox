# AI-Based Email Ransomware Detection with Sandbox Integration

## Overview
This project aims to detect ransomware distributed via email attachments using a hybrid approach that combines machine learning with sandbox-based behavioral analysis.  
The system classifies emails and attachments as safe, suspicious, or malicious, and executes high-risk files in an isolated sandbox environment for further analysis.

## Problem Statement
Ransomware attacks continue to grow in sophistication, often bypassing signature-based antivirus and spam filters. This project addresses this gap by implementing a dynamic and intelligent detection mechanism that adapts to new and evolving threats.

## Methodology
The system consists of two main layers:  
1. **AI Classification Layer**  
   - The machine learning models were trained using Python with scikit-learn and TensorFlow to classify emails as safe, suspicious, or malicious.  
   - The trained model is later integrated into the detection pipeline.  
2. **Sandbox Analysis Layer**  
   - Suspicious attachments are executed in an isolated VirtualBox sandbox.  
   - The sandbox monitors behaviors such as file encryption, process creation, and registry modifications to identify ransomware-like activity.  

This hybrid approach combines static classification with dynamic behavioral analysis to achieve higher accuracy.

## Technologies Used
- Python (for AI model training)  
- scikit-learn, TensorFlow (machine learning frameworks)  
- VirtualBox, VBoxManage (sandbox virtualization)  
- Bash / Batch scripting (automation of sandbox processes)  
- JSON / CSV (data storage and logging)

## Installation
1. Clone this repository:  
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
