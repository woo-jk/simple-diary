import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
  useReducer,
} from "react";
import "./App.css";
import DiaryEditor from "./DiaryEditor";
import DiaryList from "./DiaryList";
import Lifecycle from "./Lifecycle";
import OptimizeTest from "./OptimizeTest";

//useReducer에 들어가는 함수
const reducer = (state, action) => {
  switch (action.type) {
    case "INIT": {
      return action.data;
    }
    case "CREATE": {
      const created_date = new Date().getDate();
      const newItem = {
        ...action.data,
        created_date,
      };
      return [newItem, ...state];
    }
    case "REMOVE": {
      return state.filter((it) => it.id !== action.targetId);
    }
    case "EDIT": {
      return state.map((it) =>
        it.id === action.targetId ? { ...it, content: action.newContent } : it
      );
    }
    default:
      return state;
  }
};

// Context에 속한 외부 컴포넌트들이 사용할 수 있도록 export를 붙임
// export default가 아닌 기본 export인데 이러면 다른 파일에서 비구조화 할당을 통해 import 해야함
// ex. import App, {DiaryStateContext} from /App.js
export const DiaryStateContext = React.createContext();
export const DiaryDispatchContext = React.createContext();

function App() {
  // useState 대신 사용하는 useReducer
  // useState 를 최적화해서 대신 사용하는 것이지만 useState를 사용해도 됨
  const [data, dispatch] = useReducer(reducer, []);

  const dataId = useRef(0);

  const getData = async () => {
    const res = await fetch(
      "https://jsonplaceholder.typicode.com/comments"
    ).then((res) => res.json());

    const initData = res.slice(0, 20).map((it) => {
      return {
        author: it.email,
        content: it.body,
        emotion: Math.floor(Math.random() * 5) + 1,
        created_date: new Date().getTime(),
        id: dataId.current++,
      };
    });
    //
    dispatch({ type: "INIT", data: initData });
  };

  //처음 렌더링 될 때 실행함
  useEffect(() => {
    getData();
  }, []);

  const onCreate = useCallback((author, content, emotion) => {
    dispatch({
      type: "CREATE",
      data: { author, content, emotion, id: dataId.current },
    });
    dataId.current += 1;
  }, []);

  const onRemove = useCallback((targetId) => {
    dispatch({ type: "REMOVE", targetId });
  }, []);

  const onEdit = useCallback((targetId, newContent) => {
    dispatch({ type: "EDIT", targetId, newContent });
  }, []);

  const memoizedDispatches = useMemo(() => {
    return { onCreate, onRemove, onEdit };
  }, []);

  const getDiaryAnalysis = useMemo(() => {
    const goodCount = data.filter((it) => it.emotion >= 3).length;
    const badCount = data.length - goodCount;
    const goodRatio = (goodCount / data.length) * 100;
    return { goodCount, badCount, goodRatio };
  }, [data.length]);

  const { goodCount, badCount, goodRatio } = getDiaryAnalysis;

  return (
    // data는 DiaryStateContext로 사용
    <DiaryStateContext.Provider value={data}>
      <DiaryDispatchContext.Provider value={memoizedDispatches}>
        <div className="App">
          {/* <Lifecycle /> */}
          {/* <OptimizeTest /> */}

          <DiaryEditor />
          <div>전체 일기 : {data.length}</div>
          <div>기분이 좋은 일기 개수 : {goodCount}</div>
          <div>기분이 나쁜 일기 개수 : {badCount}</div>
          <div>기분 좋은 일기 비율 : {goodRatio}</div>
          <DiaryList />
        </div>
      </DiaryDispatchContext.Provider>
    </DiaryStateContext.Provider>
  );
}

export default App;
