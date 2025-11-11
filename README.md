# AI-Based Email Ransomware Detection with Sandbox Integration

##  Overview
This project aims to detect ransomware distributed via email attachments using a hybrid approach that combines **machine learning** with **sandbox-based behavioral analysis**.  
The system classifies emails and attachments as **safe**, **suspicious**, or **malicious**, and executes high-risk files in an isolated sandbox environment for further analysis.

##  Problem Statement
Ransomware attacks continue to grow in sophistication, often bypassing signature-based antivirus and spam filters. This project addresses this gap by implementing a dynamic and intelligent detection mechanism that adapts to new and evolving threats.

##  Methodology
The solution consists of two main components:
1. **AI Classification Layer:**  
   - Extracts features from email content and attachments.  
   - Classifies emails using a trained **machine learning model** (scikit-learn / TensorFlow).  
2. **Sandbox Analysis Layer:**  
   - Executes suspicious files in a **VirtualBox** sandbox.  
   - Monitors file behavior, encryption activity, and registry changes to detect anomalies.  

The system leverages **ensemble learning** and **threat intelligence feeds** to enhance accuracy and reduce false positives.

##  Technologies Used
- **Python** — main programming language  
- **scikit-learn**, **TensorFlow** — machine learning  
- **VirtualBox**, **VBoxManage** — sandbox virtualization  
- **pandas**, **NumPy** — data handling and preprocessing  
- **Flask** (optional) — interface for testing the model  

##  Installation
1. Clone this repository:  
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
