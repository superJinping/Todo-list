import { useEffect, useRef, useState, useCallback } from "react";
import Popup from "reactjs-popup"; // W07 CAM
import "reactjs-popup/dist/index.css"; // W07 CAM
import Webcam from "react-webcam"; // W07 CAM
import { addPhoto, GetPhotoSrc } from "../db.jsx"; // W07 CAM
import Icon from "@mui/material/Icon";
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

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

  const editFieldRef = useRef(null);
  const editButtonRef = useRef(null);

  const wasEditing = usePrevious(isEditing);

  function handleChange(event) {
    setNewName(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    props.editTask(props.id, newName);
    setNewName("");
    setEditing(false);
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
          <a href={props.location.mapURL}>(map)</a> {/*W07 CAM - improvement*/}
          &nbsp; | &nbsp;
          <a href={props.location.smsURL}>(sms)</a> {/*W07 CAM - improvement*/}
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
//
const WebcamCapture = (props,closePopup) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgId, setImgId] = useState(null);
  const [photoSave, setPhotoSave] = useState(false);

  useEffect(() => {
    if (photoSave) {
      console.log("useEffect detected photoSave");
      props.photoedTask(imgId); // 确保这个回调函数处理了必要的更新逻辑
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
    <>
      {!imgSrc && (
        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
      )}
      {imgSrc && <img src={imgSrc} alt="Captured" />}
      <div className="btn-group">
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
    </>
  );
};

// W07 CAM - New Component ViewPhoto
//
const ViewPhoto = (props) => {
  const photoSrc = GetPhotoSrc(props.id);
  return (
    <>
      <div>
        <img src={photoSrc} alt={props.name} />
      </div>
    </>
  );
};

const closeBtnStyle = {
  position: 'absolute',  
  top: '0.5rem',         
  right: '0.5rem',       
};