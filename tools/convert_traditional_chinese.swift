import Foundation

let inputData = FileHandle.standardInput.readDataToEndOfFile()
let values = try JSONSerialization.jsonObject(with: inputData) as! [String]
let converted = values.map { value -> String in
    let text = NSMutableString(string: value)
    CFStringTransform(text, nil, "Traditional-Simplified" as CFString, false)
    return text as String
}
let output = try JSONSerialization.data(withJSONObject: converted, options: [.fragmentsAllowed, .sortedKeys])
FileHandle.standardOutput.write(output)
FileHandle.standardOutput.write(Data([0x0a]))
