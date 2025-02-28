//这里配置群聊的信息
export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
}

export const groups: Group[] = [
  {
    id: 'group1',
    name: '满眼都是💖竹',
    description: '满眼都是💖竹',
    members: ['ai10']
  }
  // {
  //   id: 'group2',
  //   name: '王海菊交流群',
  //   description: '王海菊交流群',
  //   members: ['ai4', 'ai5', 'ai6', 'ai7']
  // }
];
