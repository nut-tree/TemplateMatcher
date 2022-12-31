import finder from './index';

finder.findMatch({ needle: './123.png' }).then((res) => {
  console.log(res);
});
