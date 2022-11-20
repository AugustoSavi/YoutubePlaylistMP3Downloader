for path in $(ls -d */); do
	gnome-terminal --title=$path -x sh -c "cd $path && npm run dev; bash"
done