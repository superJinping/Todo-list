import { useState, useRef, useEffect } from "react";
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";
import Todo from "./components/Todo";
import { nanoid } from "nanoid";

function usePrevious(value) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const FILTER_MAP = {
  All: () => true,
  Active: (task) => !task.completed,
  Completed: (task) => task.completed,
};

const FILTER_NAMES = Object.keys(FILTER_MAP);

export default function App(props) {
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const geoFindMe = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by your browser");
      setError("Geolocation is not supported by your browser。");
    } else {
      console.log("Locating…");
      navigator.geolocation.getCurrentPosition(success, handleError);
    }
  };

  const success = (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log(latitude, longitude);

    console.log(`Latitude: ${latitude}°, Longitude: ${longitude}°`);
    console.log(
      `Try it here: https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`
    );
    locateTask(lastInsertedId, {
      latitude: latitude,
      longitude: longitude,
      error: "",
      mapURL: `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`, // W07 CAM
      smsURL: `sms://00447700900xxxx?body=https://maps.google.com/?q=${latitude},${longitude}`, // W07 CAM
    });
  };

  const handleError = () => {
    console.log("Unable to retrieve your location");
    setError("Unable to retrieve your location");
  };

  function usePersistedState(key, defaultValue) {
    const [state, setState] = useState(
      () => JSON.parse(localStorage.getItem(key)) || defaultValue
    );
    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);
    return [state, setState];
  }

  const [tasks, setTasks] = usePersistedState("tasks", []);
  const [filter, setFilter] = useState("All");
  const [lastInsertedId, setLastInsertedId] = useState("");

  function toggleTaskCompleted(id) {
    const updatedTasks = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        // use object spread to make a new obkect
        // whose `completed` prop has been inverted
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    setTasks(updatedTasks);
  }

  function deleteTask(id) {
    const isConfirmed = window.confirm("Are you sure you want to delete this item?");
    if (isConfirmed) {
    const remainingTasks = tasks.filter((task) => id !== task.id);
    setTasks(remainingTasks);
    }
  }

  function editTask(id, newName) {
    const editedTaskList = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        return { ...task, name: newName }; // Copy the task and update its name
      }
      return task; // Return the original task if it's not the edited task
    });
    setTasks(editedTaskList);
  }

  function locateTask(id, location) {
    console.log("locate Task", id, " before");
    console.log(location, tasks);
    const locatedTaskList = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        //
        return { ...task, location: location };
      }
      return task;
    });
    console.log(locatedTaskList);
    setTasks(locatedTaskList);
  }

  // W07 CAM - NEW FUNCTION
  function photoedTask(id) {
    console.log("photoedTask", id);
    const photoedTaskList = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        //
        return { ...task, photo: true };
      }
      return task;
    });
    console.log(photoedTaskList);
    setTasks(photoedTaskList);
  }

  const taskList = tasks?.filter(FILTER_MAP[filter]).map((task) => (
    
    <Todo
      id={task.id}
      name={task.name}
      completed={task.completed}
      key={task.id}
      location={task.location} 
      toggleTaskCompleted={toggleTaskCompleted}
      photoedTask={photoedTask} 
      deleteTask={deleteTask}
      editTask={editTask}
    />
  ));

  const filterList = FILTER_NAMES.map((name) => (
    <FilterButton
      key={name}
      name={name}
      isPressed={name === filter}
      setFilter={setFilter}
    />
  ));
  
  function getLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 100000 }); 
    });
  }
  
  async function addTask(name) {
    console.log('addTask is called with:', name);
    const id = "todo-" + nanoid();
    let location = { latitude: "Unknown", longitude: "Unknown"};
  
    try {
      const position = await getLocation();
      location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      setError(null); // 如果位置获取成功，清除之前的错误信息
    } catch (err) {
      console.error("Geolocation error: ", err);
      setError("Location information cannot be obtained"); // 设置错误状态

    }
  
    const newTask = {
      id: id,
      name: name,
      completed: false,
      location: location
    };
  
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks, newTask];
      return updatedTasks;
    });
  
    // 任务添加后清空输入
    setName('');
  }
  useEffect(() => {
    console.log('Updated tasks list:', tasks);
  }, [tasks]);

  const tasksNoun = taskList.length !== 1 ? "tasks" : "task";
  const headingText = `${taskList.length} ${tasksNoun} remaining`;

  const listHeadingRef = useRef(null);
  const prevTaskLength = usePrevious(tasks.length);

  useEffect(() => {
    if (tasks.length < prevTaskLength === -1) {
      listHeadingRef.current.focus();
    }
  }, [tasks.length, prevTaskLength]);
  useEffect(() => {
    console.log("Updated tasks list:", tasks);
  }, [tasks]);
  return (
    <div className="todoapp stack-large">
      <h1>JYP TodoMatic</h1>
      <Form addTask={addTask} geoFindMe={geoFindMe} />{" "}
      {error && <div className="error">{error}</div>}
      <div className="filters btn-group stack-exception">{filterList}</div>
      <h2 id="list-heading" tabIndex="-1" ref={listHeadingRef}>
        {headingText}
      </h2>
      <ul
        aria-labelledby="list-heading"
        className="todo-list stack-large stack-exception"
        role="list"
      >
        {taskList}
      </ul>
    </div>
  );
}
