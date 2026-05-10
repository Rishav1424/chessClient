import PlayButton from "./PlayButton"

const PlayGroup = () => {
  return (
    <div className="p-12 w-full">
        <div className="grid gap-4 grid-cols-3 grid-rows-2 justify-items-center">
            <PlayButton/>
            <PlayButton/>
            <PlayButton/>
            <PlayButton/>
            <PlayButton/>
            <PlayButton/>
        </div>
    </div>
  )
}

export default PlayGroup