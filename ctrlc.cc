#include <node.h>
#include <windows.h>

namespace ctrlc {

  using v8::FunctionCallbackInfo;
  using v8::Isolate;
  using v8::Local;
  using v8::Object;
  using v8::String;
  using v8::Value;

  void SigintWindows(const v8::FunctionCallbackInfo < v8::Value > & args) {
    v8::Isolate * isolate = args.GetIsolate();
    v8::HandleScope scope(isolate);

    // Check the number of arguments passed
    if (args.Length() != 1) {
      v8::Local < v8::String > v8String = v8::String::NewFromUtf8(isolate, "Invalid arguments").ToLocalChecked();
      isolate -> ThrowException(v8::Exception::TypeError(v8String));

      return;
    }

    // Check the argument types
    if (!args[0] -> IsUint32()) {
      v8::Local < v8::String > v8String = v8::String::NewFromUtf8(isolate, "Argument must be a number").ToLocalChecked();
      isolate -> ThrowException(v8::Exception::TypeError(v8String));

      return;
    }

    DWORD processId = args[0] -> Uint32Value(isolate -> GetCurrentContext()).ToChecked();

    HANDLE hProcess = OpenProcess(SYNCHRONIZE | PROCESS_TERMINATE, FALSE, processId);
    if (hProcess == NULL) {
      v8::Local<v8::String> v8String = v8::String::NewFromUtf8(isolate, ("Failed to open process. Error code: " + std::to_string(GetLastError())).c_str()).ToLocalChecked();
      isolate->ThrowException(v8::Exception::Error(v8String));

      return;
    }

    // Try to attach to console
    if (!AttachConsole(processId)) {
      v8::Local<v8::String> v8String = v8::String::NewFromUtf8(isolate, ("Failed to attach to console. Error code: " + std::to_string(GetLastError())).c_str()).ToLocalChecked();
      isolate->ThrowException(v8::Exception::Error(v8String));

      // If attaching to console fails, try sending Ctrl-C event directly
      if (!GenerateConsoleCtrlEvent(CTRL_C_EVENT, processId)) {
        v8::Local<v8::String> v8String = v8::String::NewFromUtf8(isolate, ("Failed to send Ctrl-C event. Error code: " + std::to_string(GetLastError())).c_str()).ToLocalChecked();
        isolate->ThrowException(v8::Exception::Error(v8String));

        CloseHandle(hProcess);

        return;
      } else {
        args.GetReturnValue().Set(true);
        return;
      }
    } else {
      // Disable Ctrl-C handling for our program
      if (!SetConsoleCtrlHandler(NULL, TRUE)) {
        v8::Local<v8::String> v8String = v8::String::NewFromUtf8(isolate, ("Failed to disable Ctrl-C handling. Error code: " + std::to_string(GetLastError())).c_str()).ToLocalChecked();
        isolate->ThrowException(v8::Exception::Error(v8String));

        CloseHandle(hProcess);

        return;
      }

      // Send Ctrl-C event
      if (!GenerateConsoleCtrlEvent(CTRL_C_EVENT, 0)) {
        v8::Local<v8::String> v8String = v8::String::NewFromUtf8(isolate, ("Failed to send Ctrl-C event. Error code: " + std::to_string(GetLastError())).c_str()).ToLocalChecked();
        isolate->ThrowException(v8::Exception::Error(v8String));

        // Re-enable Ctrl-C handling
        if (!SetConsoleCtrlHandler(NULL, FALSE)) {
          v8::Local<v8::String> v8String = v8::String::NewFromUtf8(isolate, ("Failed to re-enable Ctrl-C handling. Error code: " + std::to_string(GetLastError())).c_str()).ToLocalChecked();
          isolate->ThrowException(v8::Exception::Error(v8String));
        }

        FreeConsole();
        CloseHandle(hProcess);
        return;
      } else {
        // Wait for process to exit
        if (WaitForSingleObject(hProcess, 2000) != WAIT_OBJECT_0) {
          v8::Local<v8::String> v8String = v8::String::NewFromUtf8(isolate, "Process did not exit within 2 seconds.").ToLocalChecked();
          isolate->ThrowException(v8::Exception::Error(v8String));
        }

        // Re-enable Ctrl-C handling
        if (!SetConsoleCtrlHandler(NULL, FALSE)) {
          v8::Local<v8::String> v8String = v8::String::NewFromUtf8(isolate, ("Failed to re-enable Ctrl-C handling. Error code: " + std::to_string(GetLastError())).c_str()).ToLocalChecked();
          isolate->ThrowException(v8::Exception::Error(v8String));
        }

        FreeConsole();
        CloseHandle(hProcess);
        return;
      }
    }

    // Re-enable Ctrl-C handling
    if (!SetConsoleCtrlHandler(NULL, FALSE)) {
      v8::Local<v8::String> v8String = v8::String::NewFromUtf8(isolate, "Failed to re-enable Ctrl-C handling").ToLocalChecked();
      isolate->ThrowException(v8::Exception::Error(v8String));

      CloseHandle(hProcess);
      
      return;
    }

    FreeConsole();
    CloseHandle(hProcess);
    args.GetReturnValue().Set(True(isolate));
  }

  void Init(Local < Object > exports) {
    NODE_SET_METHOD(exports, "sigintWindows", SigintWindows);
  }

  NODE_MODULE(ctrlc, Init)

} // namespace ctrlc