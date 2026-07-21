module edk.docs.effects;

import edk.docs.types.{DocumentFormat, DocumentInput, DocumentOutput};

public effect EdkDocs extends FileIO {
    action convert(input: DocumentInput, target: DocumentFormat) -> DocumentOutput;
}
