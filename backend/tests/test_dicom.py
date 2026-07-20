"""Tests for DICOM conversion and metadata extraction."""

from pathlib import Path

import numpy as np
import pytest

from app.services.dicom import (
    convert_dicom_to_png,
    extract_dicom_metadata,
    is_dicom_path,
    prepare_image_for_inference,
)


def test_is_dicom_path():
    assert is_dicom_path(Path("study.dcm"))
    assert is_dicom_path(Path("study.DICOM"))
    assert not is_dicom_path(Path("xray.png"))


def test_prepare_non_dicom_passthrough(tmp_path: Path):
    png = tmp_path / "x.png"
    png.write_bytes(b"fake")
    path, original, meta = prepare_image_for_inference(png)
    assert path == png
    assert original is None
    assert meta is None


def test_convert_synthetic_dicom(tmp_path: Path):
    pydicom = pytest.importorskip("pydicom")
    from pydicom.dataset import Dataset, FileDataset, FileMetaDataset
    from pydicom.uid import ExplicitVRLittleEndian, SecondaryCaptureImageStorage

    filename = tmp_path / "chest.dcm"
    file_meta = FileMetaDataset()
    file_meta.MediaStorageSOPClassUID = SecondaryCaptureImageStorage
    file_meta.MediaStorageSOPInstanceUID = "1.2.3.4.5"
    file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    file_meta.ImplementationClassUID = "1.2.3"

    ds = FileDataset(str(filename), {}, file_meta=file_meta, preamble=b"\0" * 128)
    ds.SOPClassUID = SecondaryCaptureImageStorage
    ds.SOPInstanceUID = "1.2.3.4.5"
    ds.PatientName = "Test^Patient"
    ds.PatientID = "P001"
    ds.Modality = "CR"
    ds.StudyDate = "20260115"
    ds.BodyPartExamined = "CHEST"
    ds.Rows = 64
    ds.Columns = 64
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    ds.BitsAllocated = 8
    ds.BitsStored = 8
    ds.HighBit = 7
    ds.PixelRepresentation = 0
    ds.PixelData = np.arange(64 * 64, dtype=np.uint8).tobytes()

    ds.save_as(str(filename), write_like_original=False)

    result = convert_dicom_to_png(filename)
    assert result.png_path.exists()
    assert result.png_path.suffix == ".png"
    assert result.metadata["modality"] == "CR"
    assert result.metadata["patient_id"] == "P001"
    assert result.metadata["source_format"] == "DICOM"
    assert result.metadata["rows"] == 64

    meta = extract_dicom_metadata(pydicom.dcmread(str(filename)))
    assert meta["study_date"] == "20260115"
