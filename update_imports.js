const fs = require('fs');
const path = './src/app/index.tsx';

let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`	Modal,
	OfflineIndicator,
	RouteFallback,
	StaggeredMenu,
	type StaggeredMenuItem,
} from "@/shared/components";`,
`	Modal,
	OfflineIndicator,
	RouteFallback,
} from "@/shared/components/LayoutBlocks";
import { StaggeredMenu, type StaggeredMenuItem } from "@/shared/components/StaggeredMenu";`
);

fs.writeFileSync(path, content);
