import React, { useEffect, useRef, useState, useCallback } from "react";
import Popup from 'reactjs-popup'; // W07 CAM
import "reactjs-popup/dist/index.css"; // W07 CAM
import Webcam from "react-webcam"; // W07 CAM
import { addPhoto, GetPhotoSrc, db } from "../db.jsx"; // W07 CAM
import Icon from "@mui/material/Icon";
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import PhotoIcon from '@mui/icons-material/Photo';
import { MapContainer, TileLayer, Marker, Popup as LeafletPopup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useLiveQuery } from 'dexie-react-hooks';
import styles from './WebcamCapture.module.css';




function usePrevious(value) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


// Main Todo Component ----
export default function Todo(props) {
  const [isEditing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const { location } = props;
  const editFieldRef = useRef(null);
  const editButtonRef = useRef(null);

  const wasEditing = usePrevious(isEditing);


  const mapUrl = location && location.latitude !== "Unknown" ?
    `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}` :
    null;
  function handleChange(event) {
    setNewName(event.target.value);
  }

  function handleSubmit(event) {

    event.preventDefault();
    props.editTask(props.id, newName);
    setNewName("");
    setEditing(false);
  }
  function TodoMap({ location, closePopup, name }) {
    const [showMap, setShowMap] = useState(true);
    if (!location || location.latitude === "Unknown" || location.longitude === "Unknown" || !showMap) {
      return null;
    }

    const position = [location.latitude, location.longitude];

    return (
      <div style={{ position: 'relative' }}> {/* 包裹地图和关闭按钮的容器 */}
        <MapContainer center={position} zoom={13} style={{
          height: '80vh',
          width: '80vw',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <LeafletPopup>{name}</LeafletPopup>
          </Marker>
        </MapContainer>
        <button
          style={{
            position: 'absolute',
            top: '200px',
            right: '0px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.5)',
            border: 'none',
            borderRadius: '4px',
            padding: '10px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onClick={() => {
            closePopup && closePopup();
          }}
        >
          Close Map
        </button>
      </div>
    );
  }

  const editingTemplate = (
    <form className="stack-small" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="todo-label" htmlFor={props.id}>
          New name for {props.name}
        </label>
        <input
          id={props.id}
          className="todo-text"
          type="text"
          value={newName || props.name}
          onChange={handleChange}
          ref={editFieldRef}
        />
      </div>
      <div className="btn-group">
        <button
          type="button"
          className="btn todo-cancel"
          onClick={() => setEditing(false)}
        >
          Cancel
          <span className="visually-hidden">renaming {props.name}</span>
        </button>
        <button type="submit" className="btn btn__primary todo-edit">
          Save
          <span className="visually-hidden">new name for {props.name}</span>
        </button>
      </div>
    </form>
  );

  //按钮
  const viewTemplate = (
    <div className="stack-small">
      <div className="c-cb">
        <input
          id={props.id}
          type="checkbox"
          defaultChecked={props.completed}
          onChange={() => props.toggleTaskCompleted(props.id)}
        />

        <label className="todo-label" htmlFor={props.id}>
          {props.name}
          {props.location && (
            <Popup
              trigger={<button className="button">   View location </button>}
              modal
              closeOnDocumentClick
            >
              {close => (
                <TodoMap location={props.location} name={props.name} closePopup={close} />
              )}
            </Popup>
          )}
        </label>
      </div>
      <div className="btn-group">
        <button
          type="button"
          className="btn"
          onClick={() => {
            setEditing(true);
          }}
          ref={editButtonRef}
        >
          <EditIcon /><span className="visually-hidden">{props.name}</span>
        </button>
        {/*W07 CAM - Popup Take Photo*/}
        <Popup
          trigger={
            <button type="button" className="btn icon-button">
              <PhotoCameraIcon />
            </button>

          }
          modal
        >
          {close => (
            <div style={{ position: 'relative' }}>
              <button className="close-button" onClick={close} style={closeBtnStyle}>
                <CloseIcon />
              </button>
              <WebcamCapture id={props.id} photoedTask={props.photoedTask} />
            </div>
          )}
        </Popup>
        <Popup
          trigger={
            <button type="button" className="btn icon-button">
              <PhotoLibraryIcon />
            </button>

          }
          modal
        >
          {close => (
            <div style={{ position: 'relative' }}>
              <button className="close-button" onClick={close} style={closeBtnStyle}>
                <CloseIcon />
              </button>
              <ViewPhoto id={props.id} alt={props.name} />
            </div>
          )}
        </Popup>
        <Popup
          trigger={
            <button type="button" className="btn icon-button">
              <PhotoIcon /> {/* 使用新图标 */}
              <span className="visually-hidden">Choose Image</span>
            </button>
          }
          modal
        >
          {close => (
            <div style={{ position: 'relative' }}>
              <button className="close-button" onClick={close} style={closeBtnStyle}>
                <CloseIcon />
              </button>
              <ImagePicker id={props.id} photoedTask={props.photoedTask} onImagePicked={(imageData) => {
                onImageSelected(imageData);
                close(); // 调用 close 来关闭模态框
              }} />
            </div>
          )}
        </Popup>

        <button
          type="button"
          className="btn btn__danger"
          onClick={() => props.deleteTask(props.id)}
        >
          <DeleteIcon /><span className="visually-hidden">{props.name}</span>
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (!wasEditing && isEditing) {
      editFieldRef.current.focus();
    } else if (wasEditing && !isEditing) {
      editButtonRef.current.focus();
    }
  }, [wasEditing, isEditing]);

  return <li className="todo">{isEditing ? editingTemplate : viewTemplate}</li>;
}

// W07 CAM - New Component WebcamCapture
const WebcamCapture = (props, closePopup) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgId, setImgId] = useState(null);
  const [photoSave, setPhotoSave] = useState(false);

  useEffect(() => {
    if (photoSave) {
      console.log("useEffect detected photoSave");
      props.photoedTask(imgId);
      setPhotoSave(false);
    }
  }, [photoSave, imgId, props]);

  console.log("WebCamCapture", props.id);
  const capture = useCallback(
    (id) => {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      console.log("capture", imageSrc.length, id);
    },
    [webcamRef, setImgSrc]
  );

  const savePhoto = async () => {
    console.log("savePhoto", imgSrc);
    if (imgSrc) {
      try {
        await addPhoto(props.id, imgSrc);
        alert("Photo saved successfully!");
        setImgId(props.id);
        setPhotoSave(true);
      } catch (error) {
        console.error("Failed to save photo:", error);
      }
    }
  };


  const cancelPhoto = (id, imgSrc) => {
    console.log("cancelPhoto", imgSrc.length, id);
  };

  return (
    <div className={styles.webcamContainer}>
      {!imgSrc && (
        <Webcam 
        audio={false} 
        ref={webcamRef} 
        screenshotFormat="image/jpeg"
        className={styles.webcam}
         />
      )}
      {imgSrc && <img src={imgSrc} alt="Captured" className={styles.webcam} />}
      <div className={styles['btn-group']}>
        {!imgSrc && (
          <button
            type="button"
            className="btn"
            onClick={capture}
          >
            Capture Photo
          </button>
        )}
        {imgSrc && (
          <button
            type="button"
            className="btn"
            onClick={savePhoto}
          >
            Save Photo
          </button>
        )}
      </div>
    </div>
  );
};

// W07 CAM - New Component ViewPhoto
const ViewPhoto = (props) => {
  // 使用 useLiveQuery 直接在组件内部进行数据查询。
  // 我们使用 `.first()` 来直接获取第一个匹配项而不是一个数组。
  const photo = useLiveQuery(() => db.photos.where("id").equals(props.id).first());
// 如果 useLiveQuery 还没有返回结果（包括完成加载但没有结果的情况），
  // 我们会显示“暂时没有照片”。
  if (!photo) {
    return <div>No photo</div>;
  }

  // 如果有照片，我们将显示它。
  return (
    <div>
      <img src={photo.imgSrc} alt={props.name} className={styles.imageFullSize}/>
    </div>
  );
};





//从相册中选取的照片
function ImagePicker({ onImagePicked, id, photoedTask }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();

      reader.onload = (e) => {
        setSelectedImage(e.target.result); // 显示预览
      };

      reader.readAsDataURL(event.target.files[0]);
    }
  };

  // 用户确认选择的图片
  const handleConfirmSelection = async () => {
    if (selectedImage) {
      try {
        await addPhoto(id, selectedImage); // 保存照片
        alert("Photo uploaded successfully!");
        photoedTask(id); // 通知父组件
        onImagePicked(selectedImage); // 可选，如果需要在父组件中进一步处理
      } catch (error) {
        console.error("Failed to upload photo:", error);
      }
    }
  };

  return (
    <>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {selectedImage && (
        <>
          <img src={selectedImage} alt="Selected" style={{ maxWidth: '100%', maxHeight: '400px' }} />
          <button onClick={handleConfirmSelection}>Confirm Upload</button>
        </>
      )}
    </>
  );
}


const closeBtnStyle = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  zIndex: 1000,
};


