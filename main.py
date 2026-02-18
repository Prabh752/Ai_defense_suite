
import os
import sys

def main():
    print("AI-Powered Intrusion Detection System (IDS)")
    print("===========================================")
    print("1. Train Models")
    print("2. Run Detection Engine (Standalone)")
    print("3. Exit")
    
    choice = input("Enter choice: ")
    
    if choice == '1':
        print("Starting training process...")
        os.system("python python_src/training/train_models.py")
    elif choice == '2':
        print("Starting detection engine...")
        os.system("python python_src/detection/detection_engine.py")
    elif choice == '3':
        sys.exit()
    else:
        print("Invalid choice. Please run again.")

if __name__ == "__main__":
    main()
